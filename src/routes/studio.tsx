import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Studio — AURORA" },
      { name: "description", content: "The full AURORA studio: upload references, pick a model, run generations and iterate on cinematic shots." },
      { property: "og:title", content: "AURORA STUDIO" },
      { property: "og:description", content: "Run image and video generations across every top model from one canvas." },

      { property: "og:url", content: "https://auroraperformancestudio.com/studio" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://auroraperformancestudio.com/studio" }],
  }),
});

