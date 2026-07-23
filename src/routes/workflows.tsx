import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/workflows")({
  head: () => ({
    meta: [
      { title: "Workflows | AURORA STUDIO" },
      { name: "description", content: "Save, share, and re-run your AURORA generation graphs across image, video and lip-sync models." },
      { property: "og:title", content: "AURORA Workflows" },
      { property: "og:description", content: "Reusable multi-model AI workflows you can save, share and re-run." },

      { property: "og:url", content: "https://auroraperformancestudio.com/workflows" },
    ],
    links: [{ rel: "canonical", href: "https://auroraperformancestudio.com/workflows" }],
  }),
});

