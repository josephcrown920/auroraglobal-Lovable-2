import type { AIProvider } from "./types";
import type { GenerationResult } from "../types";

export class StubProvider implements AIProvider {
  constructor(public name: string) {}

  private stub(model: string): GenerationResult {
    return {
      id: crypto.randomUUID(),
      url: "",
      provider: this.name,
      model,
      duration: 0,
      costInCredits: 0,
      metadata: { stub: true },
      timestamp: new Date(),
    };
  }

  async generateImage() { return this.stub("image"); }
  async generateVideo() { return this.stub("video"); }
  async generateLipsync() { return this.stub("lipsync"); }
}
