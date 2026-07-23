import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — AURORA STUDIO" },
      { name: "description", content: "Sign in or create an AURORA STUDIO account. 5 free Aura on signup." },
      { property: "og:title", content: "Sign in to AURORA STUDIO" },
      { property: "og:description", content: "Sign in or create an AURORA account. New creators get 5 free Aura." },

      { property: "og:url", content: "https://auroraperformancestudio.com/auth" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://auroraperformancestudio.com/auth" }],
  }),
});
