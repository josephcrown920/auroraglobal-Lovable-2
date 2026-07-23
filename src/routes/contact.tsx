import { createFileRoute } from "@tanstack/react-router";
import { COMPANY } from "@/lib/legal";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: `Contact — ${COMPANY.product}` },
      { name: "description", content: "Get in touch with the AURORA team — support, billing, abuse and press inquiries." },
      { property: "og:title", content: "Contact AURORA STUDIO" },
      { property: "og:description", content: "Reach AURORA for support, billing, press and abuse." },

      { property: "og:url", content: "https://auroraperformancestudio.com/contact" },
    ],
    links: [{ rel: "canonical", href: "https://auroraperformancestudio.com/contact" }],
  }),
});

