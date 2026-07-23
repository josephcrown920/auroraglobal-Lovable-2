# AURORA Performance Studio — Snapshot

Point-in-time snapshot of the locked UI, intended for porting to the Replit master repo. Timestamp: 2026-07-23.

## What's locked in this snapshot

- Top nav wordmark: `AURORA PERFORMANCE STUDIO` (uppercase, tracked). Truncates to `AURORA` under `sm`.
- Global floating **Menu** button lowered to `top: calc(env(safe-area-inset-top) + 4.25rem)` so it no longer overlaps the wordmark on any viewport.
- Sidebar drawer sections in this order: **Artists** → **Creators** → **Account**.
- Bottom tab bar with 3 columns, breathing indicator, glass background.
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
| Brand assets | `src/assets/aurora-*.png` |

## Porting checklist (Replit master)

1. Copy `src/routes/index.tsx`, `src/components/MobileNav.tsx`, `src/routes/__root.tsx`, `src/hooks/use-auth.tsx`.
2. Copy the three `src/assets/aurora-*.png` files (or regenerate at the same dimensions).
3. Confirm the Replit build has Tailwind v4 tokens: `bg-brand`, `aurora-glass-strong`, `font-display`, `text-premium`, `--shadow-soft`, `--shadow-glow-soft`, `--gradient-hero`. They live in `src/styles.css` on this repo.
4. Confirm `@/hooks/use-auth`, `@/integrations/supabase/client`, and `@/integrations/backend-config` resolve on the Replit side (they are Lovable Cloud generated; the Replit copy can substitute its own Supabase client as long as `useAuth()` returns `{ user: { email } }`).
5. Verify server-side `/admin` routes enforce `has_role('admin')` — do not rely on the UI hide.
6. Load the site on mobile and confirm the **Menu** button sits under the AURORA PERFORMANCE STUDIO wordmark, not over it.

## Pre-existing known errors (out of scope for this snapshot)

Admin data functions (`src/lib/admin.functions.ts`) and `src/components/dashboard/ApiKeysPanel.tsx` have stale Supabase-generated types (`payments`, `jobs`, `affiliate_events` columns). Unrelated to the UI lock. Track separately.
