# Plan — 4 sequential passes

You asked for a LOT in one message. Doing it all in one turn would produce broken half-work. Here's the order I'll ship, each pass ends with a working preview you can sign off on before the next.

---

## Pass 1 — CapCut-style pricing (this turn if you approve)

Rewrite `src/lib/pricing.ts` + tests to CapCut's tiered model:

| Feature | Free tier | Pro |
|---|---|---|
| Image generation | 5 Aura | 3 Aura |
| Video 5s (Seedance/Kling std) | 25 Aura | 18 Aura |
| Video 10s | 45 Aura | 32 Aura |
| Lipsync (per 10s) | 30 Aura | 22 Aura |
| Colors Performance Session | 60 Aura | 40 Aura |
| Perform Anywhere (per shot) | 35 Aura | 25 Aura |
| TikTok30 (full pack) | 120 Aura | 80 Aura |
| Motion Control | 50 Aura | 35 Aura |
| GRWM pack | 90 Aura | 60 Aura |
| Upscale 4K | 15 Aura | 10 Aura |

Subscription tiers (monthly): Free 100 Aura · Creator $19 / 2 500 · Pro $49 / 8 000 · Studio $129 / 25 000 + priority GPU.

---

## Pass 2 — Play Store / App Store packaging

- Install `@capacitor/core` + `@capacitor/cli` + `@capacitor/android` + `@capacitor/ios`.
- `capacitor.config.ts` with `appId: com.aurora.performancestudio`, splash + icon from `aurora-logo.png`.
- `npm run build:mobile` script → static export → `npx cap sync`.
- `docs/MOBILE_PACKAGING.md` with signing / upload steps (you run `cap open android` locally; sandbox can't run Android Studio).

---

## Pass 3 — Test list (I run these, report pass/fail)

```
[ ] /            landing renders, hero image, CTAs
[ ] /dashboard   Video Agent hero visible, chatbot responds
[ ] /agent       persistent memory: send msg, reload, see history
[ ] /perform-anywhere   upload → generate → result
[ ] /tiktok30    hook → 30s pack pipeline
[ ] /colors      colors performance session generates
[ ] /lipsync     photo + audio → talking video
[ ] /studio      image generation via Lovable AI
[ ] /scene-builder   scene composition
[ ] /canvas      node workflow runs end-to-end
```

I'll drive with Playwright headless, screenshot each, and post a pass/fail table.

---

## Pass 4 — Batch Content Generation System (the big one)

### Data model
```
Collection<T> = { kind: T; items: Array<{ id, status, url, error }>; blueprint?: StyleBlueprint }
```

### DB (new migration)
```
batch_jobs (id, user_id, workflow_id, source_asset_url, variation_count,
            platform, duration, strategy, blueprint jsonb, status,
            created_at)
batch_items (id, batch_id, index, status, result_url, error, attempts,
             started_at, finished_at)
```
RLS: owner-scoped. GRANT authenticated + service_role.

### Server
- `src/lib/batch.functions.ts`
  - `createBatch({ sourceUrl, count, platform, duration, strategy })` — analyzes source, builds `StyleBlueprint` via Grok/Claude, inserts N `batch_items` rows, enqueues each into existing `public.jobs` queue.
  - `getBatch(id)` — returns rows + aggregate progress.
  - `retryBatchItem(id)`, `cancelBatch(id)`.
- Style Blueprint: single Grok call over transcript + scene metadata → JSON (rhythm, palette, caption style, hook style, tone). Reused for every variation prompt.
- Reuses the concurrent fan-out pattern from `.agents/memory/batch-lipsync-concurrent-fanout.md` — no new queue, just N rows through existing `runMediaJob`.

### Canvas node
- `BatchVideoGeneratorNode.tsx` — single React Flow node.
  - Inputs handle: `video` + optional `blueprint`.
  - Output handle: `Collection<Video>` (custom edge type `collection`).
  - Body: variation count select, platform, duration, strategy, progress bar, "View Outputs" button.
- `CollectionOutputDrawer.tsx` — grid of items with preview/download/regen/delete/approve.
- `useBatchProgress(batchId)` hook — polls `getBatch` every 3s while running.

### Execution engine (collection-aware iteration)
In `src/lib/workflow-runner.ts`:
```
if (input.type === 'collection') {
  const results = await Promise.all(
    input.items.map(item => runNode(node, { ...ctx, input: item }))
  );
  return { type: 'collection', kind: node.outputKind, items: results };
}
```
Downstream nodes (Caption, Thumbnail, Publisher) get automatic fan-out for free.

### UI on canvas
```
┌ 🎬 Batch Video Generator ───────┐
│ Source: podcast.mp4              │
│ Variations: [30 ▼]  Platform:TT  │
│ Duration: 15s  Strategy: Hooks   │
│ ✓ Preserve style/speaker/brand   │
│ ████████░░░ 18/30                │
│ [ View Outputs ]                 │
└──────────────────────────────────┘
```

### Batch export in Canvas (separate from generator)
"Export all outputs" button on any Collection edge → zip download via server fn `zipCollection`.

### Success criteria (from your spec)
- One source → N variations ✓
- Single node on canvas ✓
- Blueprint-driven style preservation ✓
- Downstream auto-iteration ✓
- Progress tracking + inspection ✓
- Scales to 100+ without canvas lag ✓

---

## What I need from you now

Reply **"go"** and I'll ship Pass 1 (pricing) immediately. Passes 2-4 each get their own turn so nothing gets rushed.

If any pricing number above is wrong, tell me the correct one before I write the code.
