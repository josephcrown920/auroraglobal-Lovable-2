import { useEffect, useState, useCallback } from "react";
import { Loader2, Upload, Shirt, Mountain, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Category = "outfit" | "scene";

type Asset = {
  id: string;
  title: string;
  image_url: string;
  tags?: string[];
};

/**
 * User-facing asset library picker for Outfits and Scenes.
 *
 * Renders two tabs: "My library" (user_assets, private per user) and
 * "Aurora presets" (admin_asset_packs, curated). Selecting an asset invokes
 * `onSelect(image_url)` so the caller can drop the URL into Canvas / Perform
 * Anywhere / Colors Studio. Users can also upload directly here.
 *
 * Requires the tables in docs/ASSET_LIBRARIES.md.
 */
export function AssetLibraryPicker({
  category,
  onSelect,
  onClose,
}: {
  category: Category;
  onSelect: (imageUrl: string, title?: string) => void;
  onClose?: () => void;
}) {
  const [tab, setTab] = useState<"mine" | "presets">("mine");
  const [items, setItems] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const table = tab === "mine" ? "user_assets" : "admin_asset_packs";
    let query = supabase.from(table as never).select("id, title, image_url, tags").eq("category", category);
    if (tab === "presets") query = query.eq("is_published", true).order("sort_order", { ascending: true });
    else query = query.order("created_at", { ascending: false });
    const { data, error } = await query;
    if (error) {
      if (/relation .* does not exist/i.test(error.message) || error.code === "42P01") {
        setTableMissing(true);
      } else if (error.code !== "PGRST301") {
        // ignore RLS empties silently
      }
      setItems([]);
    } else {
      setTableMissing(false);
      setItems((data ?? []) as Asset[]);
    }
    setLoading(false);
  }, [category, tab]);

  useEffect(() => { load(); }, [load]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Sign in to upload");
      const ext = file.name.split(".").pop() ?? "jpg";
      // Path fits assertOwnStudioUpload: first segment = caller uid.
      const path = `${uid}/library/${category}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("studio").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("studio").getPublicUrl(path);
      const { error: insErr } = await supabase.from("user_assets" as never).insert({
        category, title: file.name.replace(/\.[^.]+$/, "").slice(0, 80), image_url: pub.publicUrl,
      } as never);
      if (insErr) throw insErr;
      toast.success("Added to library");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const Icon = category === "outfit" ? Shirt : Mountain;
  const label = category === "outfit" ? "Outfits" : "Scenes";

  return (
    <div className="rounded-xl aurora-glass border border-border/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Icon className="size-4" /> {label}
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="flex gap-1">
        {(["mine", "presets"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-accent/40"
            }`}
          >
            {t === "mine" ? "My library" : "Aurora presets"}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-1.5 rounded-md bg-muted/40 px-3 py-1.5 text-xs font-medium cursor-pointer hover:bg-accent/40">
          {uploading ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
          Upload
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {tableMissing ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-100/90">
          Asset library tables not set up yet. See <code>docs/ASSET_LIBRARIES.md</code>.
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-6 text-xs text-muted-foreground flex flex-col items-center gap-2">
          <Plus className="size-4 opacity-50" />
          {tab === "mine" ? `No ${label.toLowerCase()} yet — upload to get started.` : `No presets available yet.`}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 md:grid-cols-4 max-h-[320px] overflow-y-auto">
          {items.map((a) => (
            <button
              key={a.id}
              onClick={() => onSelect(a.image_url, a.title)}
              className="group relative rounded-lg overflow-hidden border border-border/40 hover:border-primary transition"
            >
              <img src={a.image_url} alt={a.title} className="aspect-square w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                <div className="text-[10px] text-white truncate text-left">{a.title}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
