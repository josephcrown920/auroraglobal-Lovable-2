import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Boxes, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import { startBatchRun, getBatchRun, COST_BATCH_VARIANT } from "@/lib/batch.functions";
import { STYLE_BLUEPRINTS, blueprintsByCategory, findBlueprint } from "@/lib/batch/style-blueprints";
import type { Collection } from "@/lib/batch/collection";
import { BatchDrawer } from "@/components/batch/BatchDrawer";

export const Route = createLazyFileRoute("/_authenticated/batch")({
  component: BatchPage,
});

function BatchPage() {
  const [sourceVideoUrl, setSourceVideoUrl] = useState("");
  const [basePrompt, setBasePrompt] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchId, setBatchId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const startFn = useServerFn(startBatchRun);
  const getFn = useServerFn(getBatchRun);
  const navigate = useNavigate();

  const grouped = useMemo(() => blueprintsByCategory(), []);

  const toggle = (key: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else if (next.size < 20) next.add(key);
      else toast.error("Max 20 variants per batch");
      return next;
    });
  };

  const start = useMutation({
    mutationFn: async () => {
      if (!sourceVideoUrl) throw new Error("Source video URL required");
      if (selected.size === 0) throw new Error("Pick at least one style");
      return startFn({
        data: {
          sourceVideoUrl,
          blueprintKeys: Array.from(selected),
          basePrompt: basePrompt || undefined,
        },
      });
    },
    onSuccess: (r) => {
      setBatchId(r.batchId);
      setDrawerOpen(true);
      toast.success(`Batch queued: ${r.enqueued}/${r.requested} variants`);
      if (r.failed.length) toast.warning(r.failed[0]?.error || "Some variants failed to enqueue");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const runQuery = useQuery({
    queryKey: ["batch-run", batchId],
    enabled: !!batchId,
    queryFn: () => getFn({ data: { id: batchId! } }),
    refetchInterval: (q) => {
      const d = q.state.data;
      if (!d) return 4000;
      const active = d.jobs.some((j) => j.status === "queued" || j.status === "processing");
      return active ? 4000 : false;
    },
  });

  const collection = useMemo<Collection<{ videoUrl?: string; blueprintKey?: string }> | null>(() => {
    const d = runQuery.data;
    if (!d) return null;
    const blueprints = d.batch.highlights?.blueprintKeys ?? [];
    const byIndex = new Map<number, (typeof d.jobs)[number]>();
    for (const j of d.jobs) {
      const idx = j.payload?.index;
      if (typeof idx === "number") byIndex.set(idx, j);
    }
    return {
      id: d.batch.id,
      kind: "batch_variations",
      createdAt: d.batch.created_at,
      sourceVideoUrl: d.batch.source_video_url,
      variants: blueprints.map((key, i) => {
        const j = byIndex.get(i);
        const bp = findBlueprint(key);
        const url = j?.result?.video_url ?? j?.result?.url;
        const status =
          !j ? "queued"
            : j.status === "succeeded" || j.status === "done" ? "done"
            : j.status === "failed" ? "failed"
            : j.status === "processing" ? "processing"
            : "queued";
        return {
          index: i,
          status,
          label: bp?.label ?? key,
          jobId: j?.id ?? null,
          generationId: j?.generation_id ?? null,
          error: j?.error ?? null,
          data: url || key ? { videoUrl: url, blueprintKey: key } : null,
        };
      }),
    };
  }, [runQuery.data]);

  const totalCost = selected.size * COST_BATCH_VARIANT;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-primary">
          <Boxes className="h-5 w-5" />
          <span className="text-xs uppercase tracking-widest">Batch Studio</span>
        </div>
        <h1 className="mt-1 font-serif text-3xl italic text-foreground">One video, many variations</h1>
        <p className="text-sm text-muted-foreground">
          Upload once. Pick your directors. Aurora renders every variant in parallel — one node on the canvas, dozens of takes inside.
        </p>
      </header>

      <Card className="aurora-glass mb-6 space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Source video URL</label>
            <Input
              value={sourceVideoUrl}
              onChange={(e) => setSourceVideoUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Base direction (optional)</label>
            <Textarea
              value={basePrompt}
              onChange={(e) => setBasePrompt(e.target.value)}
              placeholder="cinematic restyle, keep subject identity and pose"
              className="mt-1 min-h-[42px]"
              rows={1}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {selected.size} selected · {totalCost} Aura total ({COST_BATCH_VARIANT}/variant)
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())} disabled={selected.size === 0}>
              Clear
            </Button>
            <Button
              onClick={() => start.mutate()}
              disabled={start.isPending || selected.size === 0 || !sourceVideoUrl}
            >
              {start.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
              Generate {selected.size || ""} variants
            </Button>
          </div>
        </div>
      </Card>

      <section className="space-y-5">
        {Object.entries(grouped).map(([cat, bps]) => (
          <div key={cat}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {cat.replace("_", " ")}
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {bps.map((bp) => {
                const on = selected.has(bp.key);
                return (
                  <button
                    key={bp.key}
                    type="button"
                    onClick={() => toggle(bp.key)}
                    className={`aurora-glass rounded-xl border p-3 text-left transition ${
                      on ? "border-primary bg-primary/10" : "border-white/10 hover:border-white/25"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{bp.label}</span>
                      {on && <Badge variant="secondary" className="text-[10px]">On</Badge>}
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{bp.prompt}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {STYLE_BLUEPRINTS.length === 0 && (
          <p className="text-sm text-muted-foreground">No blueprints available.</p>
        )}
      </section>

      {collection && (
        <div className="mt-8">
          <Button variant="outline" onClick={() => setDrawerOpen(true)}>
            <Boxes className="mr-1.5 h-4 w-4" />
            View current batch · {collection.variants.length} variants
          </Button>
        </div>
      )}
      {collection && (
        <BatchDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          collection={collection}
        />
      )}

      <div className="mt-6 text-xs text-muted-foreground">
        <button className="underline underline-offset-2 hover:text-foreground" onClick={() => navigate({ to: "/canvas" })}>
          ← Back to canvas
        </button>
      </div>
    </main>
  );
}
