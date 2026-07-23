import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { verifyWatermarkToken } from "@/lib/watermark-token.server";

// NOTE: `sharp` is a native Node module and is not available in the
// Cloudflare Workers runtime that hosts server routes on this stack.
// Until a Worker-compatible image pipeline (e.g. WASM-based) is wired
// up, this endpoint verifies ownership and proxies the source image
// through unchanged. The `X-Watermarked` header is dropped so callers
// know the pixels are not stamped.
export const Route = createFileRoute("/api/public/watermark-image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        const uid = url.searchParams.get("uid");
        const tok = url.searchParams.get("tok");

        if (!id || !uid || !tok) return new Response("Missing parameters", { status: 400 });
        if (!verifyWatermarkToken(tok, uid, id)) {
          return new Response("Unauthorized", { status: 403 });
        }

        const { data: gen } = (await supabaseAdmin
          .from("generations")
          .select("id, result_image_url, is_watermarked, user_id")
          .eq("id", id)
          .eq("user_id", uid)
          .maybeSingle()) as {
          data: {
            id: string;
            result_image_url: string | null;
            is_watermarked: boolean;
            user_id: string;
          } | null;
        };

        if (!gen) return new Response("Not found", { status: 404 });
        if (!gen.result_image_url) return new Response("No image", { status: 404 });
        if (!(gen as any).is_watermarked) {
          return new Response("Forbidden", { status: 403 });
        }

        try {
          const imgRes = await fetch(gen.result_image_url, {
            headers: { "User-Agent": "Aurora/1.0" },
            signal: AbortSignal.timeout(15_000),
          });
          if (!imgRes.ok) return new Response("Upstream fetch failed", { status: 502 });
          const buf = new Uint8Array(await imgRes.arrayBuffer());
          const contentType =
            imgRes.headers.get("content-type") ?? "application/octet-stream";
          return new Response(buf, {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "private, max-age=3600",
            },
          });
        } catch {
          return new Response("Image fetch failed", { status: 502 });
        }
      },
    },
  },
});
