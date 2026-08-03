# Pass 3 — Feature QA Checklist

End-to-end verification of every flagship surface before store submission.
Run each section against `id-preview--fbe27c37-e04c-4cf2-a07c-9bf41dc80761.lovable.app`
(preview) and then again on published prod after Pass 2 IAP decision.

Legend: ☐ open · ✅ pass · ❌ fail · ⚠️ pass-with-notes

---

## 0. Automated regression (baseline)

```bash
bun test
```

- ☐ **723+ tests pass** (10 pre-existing failures acceptable: 4 in `api-workers-health`
  around heartbeat mocking; 6 in `llm-fallback.server` where `res.output` is
  `undefined` even though `res.provider` selection is correct — a real bug in
  `generateWithFallback` return shape; not blocking flagship UX. Track in a
  separate fix pass.)
- ☐ Pricing, spin-engine, billing plans, and estimate tests all green (fixed
  this pass — image = 10 Aura, TikTok30 = 85 Aura flat).

---

## 1. Perform Anywhere (`/perform-anywhere`)

- ☐ Upload a single source portrait (jpg + heic + png).
- ☐ Pick a preset scene from Admin → Assets → Scenes.
- ☐ Generate 1 image. Cost debited **10 Aura**. Result renders full-quality.
- ☐ Prompt-only mode (no scene preset) works.
- ☐ Retry preserves identity (same face, new scene).
- ☐ Failure path: revoke `FAL_API_KEY` in the ledger — user sees Aura refund + toast.

## 2. Video Agent (`/dashboard` hero + `/agent`)

- ☐ Persistent memory: sign in on device A, send 3 messages, sign in on
  device B — history syncs from `agent_conversations`.
- ☐ HeyGen-style prompt bar on dashboard hero submits and streams.
- ☐ Markdown rendering: bold/italics, lists, code blocks, links all render.
- ☐ "Attach reference image" flow triggers image analysis before response.
- ☐ Agent can call tools: `generate_image`, `generate_video`, `queue_lipsync`,
  `save_to_gallery`. Verify each tool call appears in the transcript.
- ☐ Rate limit path: 20+ rapid messages → surfaces retry-after toast, no
  silent 429s.

## 3. TikTok30 (`/tiktok30`) — Premium ($85 Aura flat)

- ☐ Upload source photo + product (optional).
- ☐ Script textarea saves per-session, character counter visible.
- ☐ Generate 30 pieces — cost is **exactly 85 Aura** debited once (not
  30×2.83), verified via `credit_ledger` row.
- ☐ Per-piece deterministic allocation shown in receipts (`entryCost` sums
  to 85).
- ☐ Partial failure: kill 3 of 30 generations mid-batch → refund = 3 ×
  `entryCost` from `spin-engine`. Verify via `bun test src/lib/spin-engine.test.ts`.
- ☐ Result grid supports per-piece **Animate** button (queues video job).
- ☐ Result grid supports per-piece **Motion Control** button (routes to
  `/motion` with source pinned).
- ☐ Batch export ZIP + individual downloads.

## 4. Scene Builder (`/scene-builder`)

- ☐ Drag preset from left panel onto canvas.
- ☐ Custom prompt overlay works.
- ☐ "Save as my scene" writes to `user_assets` bucket, visible in Admin →
  Assets → Scenes (user tab).

## 5. Lipsync (`/lipsync`)

- ☐ Upload portrait + audio (mp3, wav, m4a).
- ☐ Choose voice OR upload voice sample.
- ☐ Cost matches `computeCost({ features: ['lipsync'], durationSeconds })`.
- ☐ Failure: audio > 60s → clear error before Aura debit.
- ☐ Preview player shows result inline; download works.

## 6. Colors Studio (`/colors`)

- ☐ Vibe presets (Sultry, Anthemic, Introspective, etc.) load and preview.
- ☐ Color grade compositor produces 4-up variant sheet.
- ☐ Cost verified against `colors.compositor.test.ts` expectations.

## 7. Image Generation (`/studio`)

- ☐ Text-to-image at 10 Aura/image.
- ☐ Reference image conditioning.
- ☐ Batch of 4 → 40 Aura debited (linear).
- ☐ Aspect ratios: 1:1, 9:16, 16:9, 4:5 all render correctly.

## 8. Canvas (`/canvas`) — with new Batch Output (Pass 4)

- ☐ Drag Image node → connect to Video node → run — single-piece flow.
- ☐ **Batch Video Generator** node accepts `Collection<Image>` input.
- ☐ Style Blueprint node applies to entire collection.
- ☐ Preview shows 30 thumbnails without cluttering graph.
- ☐ Export routes entire batch to gallery.

## 9. Admin surfaces (as `josephcrown920@gmail.com` / `outthemudrecordsltd@gmail.com`)

- ☐ Both emails have `admin` in `user_roles` — verify:
  ```sql
  select u.email, r.role from auth.users u
  join public.user_roles r on r.user_id = u.id
  where u.email in ('josephcrown920@gmail.com','outthemudrecordsltd@gmail.com');
  ```
- ☐ `/admin/assets` — Outfits + Scenes CRUD works for preset packs.
- ☐ `/admin/landing` — visual edits swap hero + section images live.
- ☐ Batch upload works (multi-file drop, progress, all succeed).
- ☐ `/admin/ai-gateway` — request logs stream, costs tally.

## 10. Mobile (Capacitor + PWA)

- ☐ PWA install banner on iOS Safari (share sheet → Add to Home Screen).
- ☐ PWA install prompt on Android Chrome.
- ☐ Offline shell (`/offline.html`) shown when airplane mode + reload.
- ☐ Capacitor iOS build launches, loads live URL, splash matches `#0b0814`.
- ☐ Capacitor Android build launches, loads live URL, back button works.
- ☐ Push (post-Pass 2 IAP decision if native IAP path is taken).

---

## Known non-blockers

| Area | Note |
|------|------|
| `generateWithFallback` output shape | 3 test failures — provider fires correctly but `output` field returned `undefined`. Pre-existing; needs fix in `src/lib/llm-fallback.server.ts` (AI SDK `generateObject` migration). |
| `checkGPUWorkerHealth` heartbeat mocks | 4 test failures — mock clock leaked between tests. Doesn't affect runtime behavior. |

Both slated for a dedicated cleanup pass after Pass 4.
