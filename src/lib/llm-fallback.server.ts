import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, Output } from "ai";
import type { z } from "zod";

type Provider = {
  name: string;
  enabled: boolean;
  make: () => ReturnType<typeof createOpenAICompatible>;
  model: string;
};

export type LlmProviderPreference = "auto" | "anthropic" | "xai" | "openrouter";

function providers(): Provider[] {
  return [
    {
      name: "lovable",
      enabled: !!process.env.LOVABLE_API_KEY,
      model: "google/gemini-3-flash-preview",
      make: () =>
        createOpenAICompatible({
          name: "lovable",
          baseURL: "https://ai.gateway.lovable.dev/v1",
          headers: {
            "Lovable-API-Key": process.env.LOVABLE_API_KEY!,
            "X-Lovable-AIG-SDK": "vercel-ai-sdk",
          },
        }),
    },
    {
      name: "gemini",
      enabled: !!process.env.GEMINI_API_KEY,
      model: "gemini-2.5-flash",
      make: () =>
        createOpenAICompatible({
          name: "gemini",
          baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
          headers: { Authorization: `Bearer ${process.env.GEMINI_API_KEY}` },
        }),
    },
    {
      name: "openai",
      enabled: !!process.env.OPENAI_API_KEY,
      model: "gpt-4o-mini",
      make: () =>
        createOpenAICompatible({
          name: "openai",
          baseURL: "https://api.openai.com/v1",
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        }),
    },
    {
      // Anthropic's OpenAI-compatibility endpoint: /v1/chat/completions with a
      // standard Bearer token (verified — returns authentication_error, not 404).
      name: "anthropic",
      enabled: !!process.env.ANTHROPIC_API_KEY,
      model: "claude-haiku-4-5",
      make: () =>
        createOpenAICompatible({
          name: "anthropic",
          baseURL: "https://api.anthropic.com/v1",
          headers: { Authorization: `Bearer ${process.env.ANTHROPIC_API_KEY}` },
        }),
    },
    {
      name: "xai",
      enabled: !!process.env.XAI_API_KEY,
      model: "grok-4",
      make: () =>
        createOpenAICompatible({
          name: "xai",
          baseURL: "https://api.x.ai/v1",
          headers: { Authorization: `Bearer ${process.env.XAI_API_KEY}` },
        }),
    },
    {
      name: "openrouter",
      enabled: !!process.env.OPENROUTER_API_KEY,
      model: "google/gemini-2.5-flash",
      make: () =>
        createOpenAICompatible({
          name: "openrouter",
          baseURL: "https://openrouter.ai/api/v1",
          headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
        }),
    },
    {
      // Hugging Face's OpenAI-compatible router. Routes to whichever provider
      // (Together, Fireworks, HF-hosted, etc.) is currently serving the model.
      name: "huggingface",
      enabled: !!process.env.HF_TOKEN,
      model: "meta-llama/Llama-3.3-70B-Instruct",
      make: () =>
        createOpenAICompatible({
          name: "huggingface",
          baseURL: "https://router.huggingface.co/v1",
          headers: { Authorization: `Bearer ${process.env.HF_TOKEN}` },
        }),
    },
  ];
}

export type FallbackResult<T> = { provider: string; output: T };

export async function generateWithFallback<T>(args: {
  system: string;
  prompt: string;
  // Input type is deliberately loose so schemas with .transform() infer T from
  // their OUTPUT type rather than their raw wire shape.
  schema: z.ZodType<T, z.ZodTypeDef, unknown>;
  preferredProvider?: LlmProviderPreference;
}): Promise<FallbackResult<T>> {
  const enabledProviders = providers().filter((p) => p.enabled);
  const preferred = args.preferredProvider && args.preferredProvider !== "auto"
    ? enabledProviders.filter((p) => p.name === args.preferredProvider)
    : [];
  const chain = preferred.length > 0
    ? [...preferred, ...enabledProviders.filter((p) => p.name !== args.preferredProvider)]
    : enabledProviders;
  if (chain.length === 0) throw new Error("No LLM provider keys configured");

  let lastErr: unknown;
  for (const p of chain) {
    try {
      const gateway = p.make();
      const model = gateway(p.model);
      const result = (await generateText({
        model,
        system: args.system,
        prompt: args.prompt,
        experimental_output: Output.object({ schema: args.schema }),
      } as any)) as any;
      // Prefer the SDK's parsed output when present; fall back to parsing
      // result.text against the schema. Newer AI SDK versions sometimes
      // return experimental_output as undefined even on a successful call,
      // which previously surfaced as an empty response to the agent.
      let output: T | undefined = result?.experimental_output as T | undefined;
      if (output === undefined || output === null) {
        const raw = typeof result?.text === "string" ? result.text : "";
        const stripped = raw.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
        const parsed = JSON.parse(stripped);
        output = args.schema.parse(parsed);
      }
      return { provider: p.name, output };
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[llm-fallback] ${p.name} failed: ${msg}`);
      continue;
    }
  }
  const finalMsg = lastErr instanceof Error ? lastErr.message : "All LLM providers failed";
  throw new Error(finalMsg);
}
