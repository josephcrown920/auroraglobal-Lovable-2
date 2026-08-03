import type { GenerationResult, ImageGenerationParams, VideoGenerationParams, LipsyncParams } from "../types";

export interface AIProvider {
  name: string;
  generateImage(params: ImageGenerationParams): Promise<GenerationResult>;
  generateVideo(params: VideoGenerationParams): Promise<GenerationResult>;
  generateLipsync(params: LipsyncParams): Promise<GenerationResult>;
}
