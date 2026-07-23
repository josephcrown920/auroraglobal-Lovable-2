import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor wrapper for Aurora Performance Studio.
 *
 * The web app is served from Cloudflare (TanStack Start SSR). The mobile
 * wrapper points `server.url` at the production host so the same live app
 * runs inside iOS/Android shells with zero duplicated build output.
 *
 * Set AURORA_MOBILE_SERVER_URL at build time to override (e.g. for staging
 * or a preview environment). Defaults to the published Lovable URL.
 */
const serverUrl =
  process.env.AURORA_MOBILE_SERVER_URL ||
  "https://aurora-performance-studio.lovable.app";

const config: CapacitorConfig = {
  appId: "app.aurora.performancestudio",
  appName: "Aurora Performance Studio",
  webDir: "dist",
  bundledWebRuntime: false,
  backgroundColor: "#0b0814",
  server: {
    url: serverUrl,
    cleartext: false,
    androidScheme: "https",
    iosScheme: "https",
    allowNavigation: [
      "*.lovable.app",
      "*.lovable.dev",
      "*.supabase.co",
      "*.heygen.com",
      "*.fal.ai",
      "*.paystack.co",
    ],
  },
  ios: {
    contentInset: "always",
    limitsNavigationsToAppBoundDomains: false,
    scheme: "Aurora",
    backgroundColor: "#0b0814",
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: "#0b0814",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#0b0814",
      showSpinner: false,
      androidSplashResourceName: "splash",
      iosSplashResourceName: "Splash",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0b0814",
      overlaysWebView: false,
    },
    Keyboard: {
      resize: "body",
      style: "DARK",
      resizeOnFullScreen: true,
    },
    App: {
      launchUrl: "/",
    },
  },
};

export default config;
