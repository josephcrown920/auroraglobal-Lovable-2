# AURORA Performance Studio — Snapshot

Point-in-time snapshot of the locked UI, intended for porting to the Replit master repo. Timestamp: 2026-07-24.

## What's locked in this snapshot

- Top nav wordmark: `AURORA PERFORMANCE STUDIO` (uppercase, tracked). Truncates to `AURORA` under `sm`.
- Global floating **Menu** button lowered to `top: calc(env(safe-area-inset-top) + 4.25rem)` so it no longer overlaps the wordmark on any viewport.
- Sidebar drawer sections in this order: **Artists** → **Creators** → **Account**.
- **Artists** sidebar leads with the four gold-lettered flagships: **Infinity Canvas**, **Video Agent**, **Perform Anywhere**, **Colors Performance Sessions**, followed by Motion Control, Music Video, Storyboard, Live Studios, Lip Sync, Scene Builder.
- **Creators** sidebar: TikTok30 (Premium), UGC Ads, Content Line, Image Generation, Photo Editor, Talking Avatars.
- Bottom tab bar (everyone) with 3 columns, breathing indicator, glass background: **Infinity Canvas**, **Video Agent**, **TikTok30**.
- Two canvases exist — nav always uses the full name **Infinity Canvas** (`/canvas`) to disambiguate from the legacy Canvas surface.
- Brand assets:
  - `src/assets/aurora-app-icon.png` — iOS App Store / general app icon (1024×1024)
  - `src/assets/aurora-play-icon.png` — Google Play icon (512×512)
  - `src/assets/aurora-wordmark.png` — web wordmark (1600×512)
- Favicon + apple-touch-icon wired to the app icon in `src/routes/__root.tsx`.
- Admin nav entry hidden except for the owner allowlist (`josephcrown920@gmail.com`, `outthemudrecordsltd@gmail.com`) — see `ui.md` and `src/components/MobileNav.tsx`.

## Files that define this snapshot

| Concern | File |
| --- | --- |
| Landing + top nav | `src/routes/index.tsx` |
| Drawer + menu button + tab bar | `src/components/MobileNav.tsx` |
| Head, favicons | `src/routes/__root.tsx` |
| Auth session (used for admin gate) | `src/hooks/use-auth.tsx` |
| Storyboard route + gallery | `src/routes/storyboard.tsx`, `src/components/storyboard/StoryboardGallery.tsx`, `src/components/storyboard/shots.ts` |
| Brand assets | `src/assets/aurora-*.png` |

## Porting checklist (Replit master)

1. Copy `src/routes/index.tsx`, `src/components/MobileNav.tsx`, `src/routes/__root.tsx`, `src/hooks/use-auth.tsx`.
2. Copy the three `src/assets/aurora-*.png` files (or regenerate at the same dimensions).
3. Copy the storyboard bundle: `src/routes/storyboard.tsx`, `src/routes/storyboard.lazy.tsx`, `src/components/storyboard/`, and `src/assets/storyboard/shot-*.jpg` pointers.
4. Confirm the Replit build has Tailwind v4 tokens: `bg-brand`, `aurora-glass-strong`, `font-display`, `text-premium`, `--shadow-soft`, `--shadow-glow-soft`, `--gradient-hero`. They live in `src/styles.css` on this repo.
5. Confirm `@/hooks/use-auth`, `@/integrations/supabase/client`, and `@/integrations/backend-config` resolve on the Replit side (they are Lovable Cloud generated; the Replit copy can substitute its own Supabase client as long as `useAuth()` returns `{ user: { email } }`).
6. Verify server-side `/admin` routes enforce `has_role('admin')` — do not rely on the UI hide.
7. Load the site on mobile and confirm the **Menu** button sits under the AURORA PERFORMANCE STUDIO wordmark, not over it.
8. Confirm the bottom tab bar shows **Infinity Canvas · Video Agent · TikTok30** and the Artists sidebar leads with the four gold entries.

## Database migrations

The live Lovable Cloud database has been synced up to the 2026-07-18 migration set (63 tables, including `payments`, `jobs`, `agent_sessions`, `owner_withdrawals`, `scheduler_heartbeats`, plus the full content-machine and workers tables). Replit should either point at the same Supabase project or replay `supabase/migrations/*.sql` in order — the destructive `20260718113413_*` `DROP SCHEMA public CASCADE` file must be **skipped** against any database with real data.

## Pre-existing known errors (out of scope for this snapshot)

None outstanding after the 2026-07-24 sync — the previous `admin.functions.ts` / `ApiKeysPanel.tsx` type staleness is resolved now that the migrations were applied and types regenerated.
