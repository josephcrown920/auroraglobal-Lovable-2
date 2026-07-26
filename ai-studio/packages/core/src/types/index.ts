export interface GenerationResult {
  id: string;
  url: string;
  provider: string;
  model: string;
  duration: number;
  costInCredits: number;
  metadata: Record<string, unknown>;
  timestamp: Date;
}

export interface ImageGenerationParams {
  prompt: string;
  negativePrompt?: string;
}

export interface VideoGenerationParams {
  prompt: string;
  negativePrompt?: string;
}

export interface LipsyncParams {
  script: string;
  videoUrl?: string;
  audioUrl?: string;
}
