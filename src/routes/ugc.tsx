import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/ugc")({
  head: () => ({
    meta: [
      { title: "UGC Factory | AURORA" },
      { name: "description", content: "Pick an AI avatar and generate scroll-stopping UGC ads in seconds. iPhone realism, product in hand, native social vibe." },
      { property: "og:title", content: "UGC Factory | AURORA" },

      { property: "og:description", content: "Pick an avatar, drop your product, ship UGC ads. iPhone-real, native, scroll-stopping." },
      { property: "og:url", content: "https://auroraperformancestudio.com/ugc" },
    ],
    links: [{ rel: "canonical", href: "https://auroraperformancestudio.com/ugc" }],
  }),
});

