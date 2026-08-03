import { StubProvider } from "./base";
import type { AIProvider } from "./types";

export const PROVIDERS: Record<string, AIProvider> = {
  claude: new StubProvider("claude"),
  openai: new StubProvider("openai"),
  gemini: new StubProvider("gemini"),
  fal: new StubProvider("fal"),
  huggingface: new StubProvider("huggingface"),
  replicate: new StubProvider("replicate"),
  runware: new StubProvider("runware"),
  kling: new StubProvider("kling"),
  seedance: new StubProvider("seedance"),
  minimax: new StubProvider("minimax"),
  veo: new StubProvider("veo"),
  luma: new StubProvider("luma"),
};

export function getProvider(name: string): AIProvider {
  const provider = PROVIDERS[name];
  if (!provider) throw new Error(`Unsupported provider: ${name}`);
  return provider;
}
