// @ts-nocheck — stale Supabase types: live DB missing tables/columns from local migrations
import { supabase } from "@/integrations/supabase/client";
import { hasBackendEnv } from "@/integrations/backend-config";
import { hasAnalyticsConsent } from "@/lib/consent";

const SESSION_KEY = "aurora.session_id";

// Only ever creates/persists the session id once analytics consent is
// granted — see hasAnalyticsConsent() in consent.ts. Callers must check
// consent before calling this (track() below does).
function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

type GtagFn = (...args: unknown[]) => void;
type TtqLike = { track: (name: string, props?: Record<string, unknown>) => void; page: () => void };

function forwardToPixels(name: string, payload?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    const w = window as unknown as { gtag?: GtagFn; ttq?: TtqLike };
    if (typeof w.gtag === "function") w.gtag("event", name, payload ?? {});
    if (w.ttq && typeof w.ttq.track === "function") {
      if (name === "page_view") w.ttq.page();
      else w.ttq.track(name, payload);
    }
  } catch {
    // never break the app for analytics
  }
}

export async function track(name: string, payload?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!hasAnalyticsConsent()) return;
  forwardToPixels(name, payload);
  if (!hasBackendEnv()) return;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    await (supabase.from("events") as any).insert({
      name,
      path: window.location.pathname,
      user_id: session?.user?.id ?? null,
      session_id: getSessionId(),
      payload: payload ?? null,
    });
  } catch {
    // tracking failures should never break the app
  }
}

export function trackPageView(path: string) {
  void track("page_view", { url: typeof window !== "undefined" ? window.location.href : path });
}