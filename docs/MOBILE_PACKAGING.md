# Mobile Packaging — iOS & Android (Capacitor + PWA)

Aurora Performance Studio ships as **both** a PWA (installable from the browser)
and a Capacitor-wrapped native shell that can be submitted to the App Store and
Google Play. Both surfaces load the same TanStack Start web app running on
Cloudflare — no separate mobile codebase.

---

## 1. PWA (already live)

Nothing to install. Users on Safari / Chrome / Edge can "Add to Home Screen"
and the app opens fullscreen using `/public/manifest.json` and `/public/sw.js`.

Manifest highlights:
- `display: standalone`, `orientation: portrait-primary`
- Theme + background: `#0b0814`
- Shortcuts pre-wired for **Studio**, **Motion Control**, and **Colors**
- Offline shell served from `/offline.html`

---

## 2. Capacitor (native wrapper)

Config lives at `capacitor.config.ts`. The wrapper loads the live production
URL, so shipping a new web build automatically updates the native apps
(no store re-review required for content changes).

### First-time setup (run locally, not in the sandbox)

```bash
# 1. Install Capacitor
bun add -D @capacitor/cli
bun add @capacitor/core @capacitor/ios @capacitor/android \
        @capacitor/splash-screen @capacitor/status-bar \
        @capacitor/keyboard @capacitor/app @capacitor/haptics \
        @capacitor/preferences @capacitor/share

# 2. Add native platforms
npx cap add ios
npx cap add android

# 3. Sync web config into the native projects
npx cap sync
```

### Icons & splash screens

Place the following in the repo root, then run `@capacitor/assets`:

```
resources/
  icon.png          # 1024×1024 (full-bleed, no rounding)
  icon-foreground.png  # 1024×1024 (safe area only, transparent bg)
  icon-background.png  # 1024×1024 solid #0b0814
  splash.png        # 2732×2732 (centered logo on #0b0814)
```

```bash
bunx @capacitor/assets generate --iconBackgroundColor "#0b0814" \
                                 --splashBackgroundColor "#0b0814"
```

### Signing & submission

**iOS** — open `ios/App/App.xcworkspace` in Xcode:
1. Team = your Apple Developer account
2. Bundle ID = `app.aurora.performancestudio`
3. Archive → Distribute → App Store Connect

**Android** — open `android/` in Android Studio:
1. Build → Generate Signed Bundle → **AAB**
2. Keystore: create once, store password in 1Password (NOT in repo)
3. Upload the `.aab` to Google Play Console

### Override the server URL

For staging / preview builds:

```bash
AURORA_MOBILE_SERVER_URL="https://preview.aurora.dev" npx cap sync
```

---

## 3. Store listing checklist

- [ ] App name: **Aurora Performance Studio**
- [ ] Subtitle / short description: *By Artists, for Artists — AI performance studio*
- [ ] Category: Photo & Video (primary), Entertainment (secondary)
- [ ] Age rating: 12+ (user-generated content)
- [ ] Privacy policy URL: `https://aurora-performance-studio.lovable.app/legal/privacy`
- [ ] Support URL: `https://aurora-performance-studio.lovable.app/support`
- [ ] Screenshots: 6.7" iPhone + 6.5" iPhone + 12.9" iPad + Android phone/tablet
- [ ] In-App Purchase disclosure: Aura credits + subscription tiers
- [ ] Data collection: Account, Photos (user uploads), Usage Data (analytics)

### IAP note (important)

Apple/Google require **their** in-app purchase for digital goods (Aura credits,
subscriptions) — Paystack is NOT allowed for consumables on native builds.
For v1 store submission, either:

1. **Web-only paywall** — remove all buy buttons inside the native shell, direct
   users to sign in with credits purchased on web (allowed under Apple's
   "reader" exemption if we don't mention pricing in-app), **or**
2. **Native IAP** — add `@revenuecat/purchases-capacitor`, wire Apple/Google
   product IDs to the Aura ledger via a server function.

Option 1 is faster to ship. Option 2 is required for full monetization parity.
