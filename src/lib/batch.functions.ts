// @ts-nocheck — stale Supabase types: live DB missing tables/columns from local migrations
// Batch Content Generation — one uploaded video → N styled internal variations.
//
// Design:
// - Storage reuses the existing `tiktok_remixes` table so no migration is
//   needed. The `highlights` Json column carries `{ kind: "batch_variations",
//   blueprintKeys, prompts }` so we can distinguish batch runs from the
//   original TikTok remix flow and rebuild the Collection<T> UI state.
// - Each child variant is a queued `generations` + `jobs` row created
//   atomically by the `create_generation_and_reserve` RPC (same pattern as
//   TikTok Remix). Credits are reserved per-child so a mid-run failure never
//   overcharges the user.
// - The canvas node stays a single card; the Collection<T> concept lives
//   client-side in `src/lib/batch/collection.ts`.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertTrustedUrl } from "./url-guard";
import { COST_TIKTOK_REMIX_CUT } from "./pricing";
import { STYLE_BLUEPRINTS, findBlueprint } from "./batch/style-blueprints";

const BLUEPRINT_KEYS = STYLE_BLUEPRINTS.map((b) => b.key) as [string, ...string[]];

export const StartBatchInput = z.object({
  sourceVideoUrl: z.string().url(),
  sourceImageUrl: z.string().url().optional(),
  blueprintKeys: z.array(z.enum(BLUEPRINT_KEYS)).min(1).max(20),
  basePrompt: z.string().max(500).optional(),
});

/** Per-variant cost mirrors the tuned TikTok Remix cut cost. */
export const COST_BATCH_VARIANT = COST_TIKTOK_REMIX_CUT;

export type BatchStartResult = {
  batchId: string;
  enqueued: number;
  requested: number;
  failed: Array<{ index: number; error: string }>;
};

export const startBatchRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => StartBatchInput.parse(d))
  .handler(async ({ data, context }): Promise<BatchStartResult> => {
    assertTrustedUrl(data.sourceVideoUrl);
    if (data.sourceImageUrl) assertTrustedUrl(data.sourceImageUrl);
    const userId = context.userId;

    const basePrompt =
      data.basePrompt?.trim() || "cinematic restyle, keep subject identity and pose";

    // Materialize prompts from blueprints. Skip unknown keys defensively
    // (Zod already restricted the enum, but this keeps the mapping honest).
    const resolved = data.blueprintKeys
      .map((k, i) => ({ key: k, bp: findBlueprint(k), index: i }))
      .filter((x): x is { key: string; bp: NonNullable<ReturnType<typeof findBlueprint>>; index: number } => !!x.bp);

    if (resolved.length === 0) throw new Error("No valid blueprints selected");

    const { data: parent, error: parentErr } = await supabaseAdmin
      .from("tiktok_remixes")
      .insert({
        user_id: userId,
        source_video_url: data.sourceVideoUrl,
        target_count: resolved.length,
        status: "processing",
        prompt: basePrompt,
        highlights: {
          kind: "batch_variations",
          blueprintKeys: resolved.map((r) => r.key),
        } as never,
      } as never)
      .select("id")
      .single();
    if (parentErr || !parent) throw new Error(parentErr?.message || "Failed to create batch run");
    const batchId = (parent as { id: string }).id;

    const client = supabaseAdmin as unknown as {
      rpc: (n: string, a: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
    };
    const jobIds: string[] = [];
    const failed: Array<{ index: number; error: string }> = [];

    for (const { bp, index } of resolved) {
      const prompt = `${basePrompt}. Style: ${bp.prompt}`;
      try {
        const { data: out, error } = await client.rpc("create_generation_and_reserve", {
          _user: userId,
          _kind: "batch_variation",
          _prompt: prompt,
          _amount: COST_BATCH_VARIANT,
          _payload: {
            kind: "video",
            prompt,
            sourceVideoUrl: data.sourceVideoUrl,
            sourceImageUrl: data.sourceImageUrl,
            duration: bp.durationSec,
            aspect: bp.aspect,
            batchId,
            blueprintKey: bp.key,
            index,
          },
        });
        if (error) throw new Error(error.message);
        const row = Array.isArray(out) ? out[0] : out;
        jobIds.push((row as { job_id: string }).job_id);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        failed.push({ index, error: msg });
        // Insufficient credits: don't spam-fail the remaining variants.
        if (/insufficient_credits/i.test(msg)) break;
      }
    }

    await supabaseAdmin
      .from("tiktok_remixes")
      .update({
        child_job_ids: jobIds,
        status: jobIds.length > 0 ? "processing" : "failed",
        error: failed.length
          ? `Only enqueued ${jobIds.length}/${resolved.length}: ${failed[0]?.error}`
          : null,
      } as never)
      .eq("id", batchId);

    return {
      batchId,
      enqueued: jobIds.length,
      requested: resolved.length,
      failed,
    };
  });

export const getBatchRun = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: parent, error } = await supabaseAdmin
      .from("tiktok_remixes")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error || !parent) throw new Error(error?.message || "Batch not found");

    const jobIds = Array.isArray((parent as { child_job_ids: unknown }).child_job_ids)
      ? ((parent as { child_job_ids: string[] }).child_job_ids)
      : [];

    const jobsRes = jobIds.length
      ? await supabaseAdmin
          .from("jobs")
          .select("id, status, attempts, error, generation_id, result, payload")
          .in("id", jobIds)
      : { data: [], error: null };

    const payload = JSON.parse(
      JSON.stringify({ batch: parent, jobs: jobsRes.data ?? [] }),
    ) as {
      batch: {
        id: string;
        source_video_url: string;
        status: string;
        target_count: number;
        highlights: { kind?: string; blueprintKeys?: string[] } | null;
        created_at: string;
        error: string | null;
        prompt: string | null;
      };
      jobs: Array<{
        id: string;
        status: string;
        attempts: number;
        error: string | null;
        generation_id: string | null;
        result: { video_url?: string; url?: string } | null;
        payload: { index?: number; blueprintKey?: string } | null;
      }>;
    };
    return payload;
  });

export const listBatchRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("tiktok_remixes")
      .select("id, source_video_url, status, target_count, highlights, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    // Filter down to batch_variations runs only (skip legacy TikTok remixes).
    return (data ?? []).filter((r) => {
      const h = (r as { highlights: unknown }).highlights as { kind?: string } | null;
      return h?.kind === "batch_variations";
    });
  });