// Style Blueprints — curated, deterministic "director's presets" that turn a
// single source video into N differently-styled internal variations.
//
// A blueprint is a self-contained transformation recipe: it names a look,
// carries a natural-language prompt (fed to the video restyler), and pins
// aspect ratio + duration so downstream costing is predictable.

export type BlueprintCategory =
  | "cinematic"
  | "fashion"
  | "streetwear"
  | "music_video"
  | "vintage"
  | "anime"
  | "commercial"
  | "moody";

export interface StyleBlueprint {
  key: string;
  label: string;
  category: BlueprintCategory;
  prompt: string;
  aspect: "9:16" | "1:1" | "16:9";
  durationSec: 3 | 5 | 8 | 10;
}

export const STYLE_BLUEPRINTS: StyleBlueprint[] = [
  { key: "neon_noir", label: "Neon Noir", category: "cinematic", prompt: "neon-lit rain-soaked street, teal + magenta rim light, anamorphic lens flares, slow cinematic push-in, cinematic color grade", aspect: "9:16", durationSec: 5 },
  { key: "golden_hour_rooftop", label: "Golden Hour Rooftop", category: "cinematic", prompt: "rooftop skyline at golden hour, warm rim light, wide angle hero pose, dramatic clouds, editorial cinematography", aspect: "9:16", durationSec: 5 },
  { key: "runway_luxe", label: "Runway Luxe", category: "fashion", prompt: "luxury fashion runway strut toward camera, marble backdrop, hard editorial key light, razor-sharp outfit focus, high-fashion energy", aspect: "9:16", durationSec: 5 },
  { key: "lookbook_studio", label: "Lookbook Studio", category: "fashion", prompt: "clean studio cyc backdrop, soft beauty-dish key light, slow rotating pose reveal, editorial lookbook feel", aspect: "9:16", durationSec: 5 },
  { key: "concrete_garage", label: "Concrete Garage", category: "streetwear", prompt: "raw concrete garage, industrial lights, streetwear power stance, cool blue tint, hip-hop editorial mood", aspect: "9:16", durationSec: 5 },
  { key: "subway_energy", label: "Subway Energy", category: "streetwear", prompt: "urban subway platform, motion-blurred trains, fluorescent overheads, kinetic street energy, handheld camera feel", aspect: "9:16", durationSec: 5 },
  { key: "rooftop_night_city", label: "Rooftop Night City", category: "music_video", prompt: "rooftop at night, glowing city skyline background, bokeh lights, moody rim key, music-video hero shot", aspect: "9:16", durationSec: 5 },
  { key: "smoke_stage", label: "Smoke Stage", category: "music_video", prompt: "smoke-machine haze, dramatic stage backlight, silhouette-to-face reveal, arena music video energy", aspect: "9:16", durationSec: 5 },
  { key: "vhs_retro", label: "VHS Retro", category: "vintage", prompt: "vintage VHS tape glitch, warm 80s film grain, retro chroma bleed, tracking distortion, nostalgic mood", aspect: "9:16", durationSec: 5 },
  { key: "super8_film", label: "Super8 Film", category: "vintage", prompt: "warm super 8 film grain, soft halation, 24fps organic motion, sun-flared home-movie feel", aspect: "9:16", durationSec: 5 },
  { key: "anime_speedlines", label: "Anime Speedlines", category: "anime", prompt: "anime style motion blur, dramatic speed lines, cel-shaded silhouette, whip pan transition, high-energy shonen feel", aspect: "9:16", durationSec: 5 },
  { key: "ghibli_soft", label: "Ghibli Soft", category: "anime", prompt: "soft painterly anime, watercolor lighting, gentle breeze in hair, hand-drawn atmosphere, ghibli-inspired warmth", aspect: "9:16", durationSec: 5 },
  { key: "beauty_ad", label: "Beauty Ad", category: "commercial", prompt: "clean beauty commercial, soft ring-light key, macro-focus skin detail, pastel palette, cosmetics campaign feel", aspect: "9:16", durationSec: 5 },
  { key: "product_hero", label: "Product Hero", category: "commercial", prompt: "premium product commercial energy, hero orbit rotation, dramatic key + fill, deep black background, high-contrast studio look", aspect: "9:16", durationSec: 5 },
  { key: "moody_confessional", label: "Moody Confessional", category: "moody", prompt: "intimate handheld confessional, warm practical lamp key, shallow depth of field, cinematic warmth, quiet emotional tone", aspect: "9:16", durationSec: 5 },
  { key: "noir_bw", label: "Noir B&W", category: "moody", prompt: "high-contrast black and white noir, hard shadows, single hard key light, film noir mystery mood", aspect: "9:16", durationSec: 5 },
  { key: "rain_reflection", label: "Rain Reflection", category: "cinematic", prompt: "rain-slick street reflection, puddle mirror shot, cool blue tones, cinematic slow-motion droplets", aspect: "9:16", durationSec: 5 },
  { key: "arcade_neon", label: "Arcade Neon", category: "streetwear", prompt: "retro arcade backlight bath, saturated pink + cyan neon, CRT glow, playful 80s energy", aspect: "9:16", durationSec: 5 },
  { key: "beach_sunset", label: "Beach Sunset", category: "cinematic", prompt: "beach at sunset, warm sun flare, backlit silhouette, gentle wind, dreamy summer cinematography", aspect: "9:16", durationSec: 5 },
  { key: "warehouse_loft", label: "Warehouse Loft", category: "moody", prompt: "industrial warehouse loft, large window daylight, moody concrete + steel, editorial documentary feel", aspect: "9:16", durationSec: 5 },
  { key: "cyberpunk_hologram", label: "Cyberpunk Hologram", category: "music_video", prompt: "cyberpunk hologram overlays, glitch UI shards, neon particle system, futuristic music video energy", aspect: "9:16", durationSec: 5 },
  { key: "desert_hero", label: "Desert Hero", category: "cinematic", prompt: "vast desert dune, low sun, wide hero shot, warm sand tones, dramatic scale cinematography", aspect: "9:16", durationSec: 5 },
];

export function findBlueprint(key: string): StyleBlueprint | undefined {
  return STYLE_BLUEPRINTS.find((b) => b.key === key);
}

export function blueprintsByCategory(): Record<BlueprintCategory, StyleBlueprint[]> {
  const out = {} as Record<BlueprintCategory, StyleBlueprint[]>;
  for (const b of STYLE_BLUEPRINTS) {
    (out[b.category] ??= []).push(b);
  }
  return out;
}
