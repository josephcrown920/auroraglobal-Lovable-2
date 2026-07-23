# AURORA Performance Studio — UI Guide

Locked UI reference for the marketing site + in-app shell. Mirror this when porting to the Replit master.

## Brand

- Wordmark: **AURORA PERFORMANCE STUDIO** (all caps, tracking-[0.18em], `font-display font-bold`).
- Mobile compact form: **AURORA** (below `sm` breakpoint).
- Accent: `bg-brand` dot at 8px, chromatic aurora gradient primary.
- Assets:
  - App Store icon — `src/assets/aurora-app-icon.png` (1024×1024)
  - Play Store icon — `src/assets/aurora-play-icon.png` (512×512)
  - Website wordmark — `src/assets/aurora-wordmark.png` (1600×512)
- Favicon + apple-touch-icon in `src/routes/__root.tsx` use `aurora-app-icon`.

## Top Nav (landing, `src/routes/index.tsx`)

- `sticky top-0 z-50`, `h-14`, blurred `bg-zinc-950/80`.
- Two-column grid: brand left, CTA right. Truncates on narrow viewports so the wordmark never wraps.
- CTA: signed-out shows *Sign in* + *Start creating*; signed-in shows *Open Studio*.

## Global Menu Button (`src/components/MobileNav.tsx`)

- Floating pill, top-left, **positioned at `calc(env(safe-area-inset-top) + 4.25rem)`** — sits BELOW the sticky `h-14` nav so it never occludes the AURORA PERFORMANCE STUDIO wordmark.
- Class: `phone-edge-left fixed z-[60] aurora-glass-strong rounded-full px-3.5 py-2`.
- Label: `Menu` + `<Menu />` icon.

## Sidebar Drawer

Three sections, in order:

1. **Artists** — Motion Control, Music Video, Live Studios, Colors Sessions, Lip Sync, Scene Builder.
2. **Creators** — TikTok30 (Premium), UGC Ads, Content Line, Image Generation, Photo Editor, Talking Avatars, Canvas, Video Agent.
3. **Account** — Gallery, Creator Hub, Plan & Billing, Affiliate, **Admin (owner-only, see below)**.

Footer: theme toggle.

## Bottom Tab Bar

3-column glass bar, safe-area padded. Breathing indicator + glow on active tab. Hidden on `/canvas`.

## Admin Visibility

Admin is gated in the UI by an **owner allowlist** (`ADMIN_EMAILS` in `src/components/MobileNav.tsx`):

```
josephcrown920@gmail.com
outthemudrecordsltd@gmail.com
```

- Non-matching users never see the `Admin` link in the drawer.
- Server-side, `/admin` routes must still enforce `has_role(auth.uid(), 'admin')` — the UI hide is defense-in-depth, not the security boundary.

## Landing Sections

Hero carousel → Services grid (flagship first) → Ticker → FAQs → CTA. Full source: `src/routes/index.tsx`.
