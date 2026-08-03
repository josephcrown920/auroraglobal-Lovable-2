# RevenueCat + Analytics Setup

## Analytics pixels (web + PWA)

Three ways to enable, all consent-gated (cookie banner must be accepted):

| Env var | Format | Purpose |
| --- | --- | --- |
| `VITE_GTM_CONTAINER_ID` | `GTM-XXXXXXX` | Google Tag Manager — manages everything from GTM UI |
| `VITE_GA4_MEASUREMENT_ID` | `G-XXXXXXXXXX` | Direct GA4 pageviews + events |
| `VITE_TIKTOK_PIXEL_ID` | `CXXXXXXXXXXXXXXXXXXX` | TikTok Ads pixel + events |

Set any/all in Workspace Settings → Build Secrets. When any of these are set,
the corresponding pixel loads only after the visitor accepts cookies (matches
consent gate in `src/routes/__root.tsx`).

All `track(name, payload)` calls in `src/lib/tracking.ts` fan out to:
1. Supabase `events` table (for internal analytics)
2. `gtag('event', name, payload)` — GA4
3. `ttq.track(name, payload)` — TikTok

Common events emitted: `page_view`, `signup`, `checkout_start`,
`purchase_complete`, `generation_started`, `generation_completed`.

## RevenueCat (iOS/Android IAP)

Store payments must go through Apple/Google (App Store rules). RevenueCat is
the abstraction layer.

### 1. Create RevenueCat project

1. Sign up at https://app.revenuecat.com
2. Add iOS + Android apps with bundle ID `app.aurora.performancestudio`
3. Copy the **public SDK keys** (start with `appl_` / `goog_`)

### 2. Set build secrets

Workspace Settings → Build Secrets:
- `VITE_REVENUECAT_IOS_API_KEY` = `appl_...`
- `VITE_REVENUECAT_ANDROID_API_KEY` = `goog_...`

### 3. Configure store products

In App Store Connect / Google Play Console, create products matching the
four tiers in `src/lib/subscription-plans.ts`:

| Tier | Product ID (recommended) |
| --- | --- |
| Creator | `aurora.creator.monthly` |
| Pro | `aurora.pro.monthly` |
| Studio | `aurora.studio.monthly` |

In RevenueCat: create three **entitlements** (`creator`, `pro`, `studio`),
each attached to the matching store product. Group them into one **offering**
named `default`.

### 4. Server-side sync

Configure the RevenueCat → Supabase webhook to hit
`/api/public/revenuecat-webhook` (create the route file with signature
verification using the RevenueCat auth header secret before enabling).
On `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION` events, update the user's
`profiles.subscription_tier` and top up their `aura_balance` per tier.

### 5. Usage in code

```ts
import { initRevenueCat, purchasePackage, hasEntitlement } from "@/lib/revenuecat";

// On login:
await initRevenueCat(userId);

// On upgrade tap (mobile only):
await purchasePackage("$rc_monthly", "default");

// Anywhere gating premium features:
const isPro = await hasEntitlement("pro");
```

On web, all helpers no-op and callers fall back to Paystack.
