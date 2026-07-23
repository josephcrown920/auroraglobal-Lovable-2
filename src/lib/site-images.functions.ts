"use server";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";
import { SITE_IMAGE_DEFAULTS, SITE_IMAGE_KEYS, type SiteImageKey } from "@/lib/site-images.shared";

export type SiteImageRow = {
  key: SiteImageKey;
  url: string;
  label: string;
  section: string;
  default_url: string;
  updated_at: string;
};

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden — admin only");
}

// Table only has slug/url/alt/updated_at; label/section/default_url are
// derived from the shared defaults so the admin panel gets a stable shape.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as any;

export const getSiteImages = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await db
    .from("site_images")
    .select("slug, url, updated_at");
  if (error) throw new Error(error.message);
  const bySlug = new Map<string, { url: string; updated_at: string }>();
  for (const row of (data ?? []) as Array<{ slug: string; url: string; updated_at: string }>) {
    bySlug.set(row.slug, { url: row.url, updated_at: row.updated_at });
  }
  const rows: SiteImageRow[] = SITE_IMAGE_KEYS.map((key) => {
    const def = SITE_IMAGE_DEFAULTS[key];
    const stored = bySlug.get(key);
    return {
      key,
      url: stored?.url ?? def.url,
      label: def.label,
      section: def.section,
      default_url: def.url,
      updated_at: stored?.updated_at ?? "",
    };
  });
  rows.sort((a, b) => (a.section === b.section ? a.key.localeCompare(b.key) : a.section.localeCompare(b.section)));
  return rows;
});

export const adminUpdateSiteImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ key: z.string(), url: z.string().url() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await db
      .from("site_images")
      .upsert({ slug: data.key, url: data.url, updated_at: new Date().toISOString() }, { onConflict: "slug" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminResetSiteImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ key: z.string() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const def = SITE_IMAGE_DEFAULTS[data.key as SiteImageKey];
    if (!def) throw new Error("Unknown key");
    const { error } = await db
      .from("site_images")
      .upsert({ slug: data.key, url: def.url, updated_at: new Date().toISOString() }, { onConflict: "slug" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
