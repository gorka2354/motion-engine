// Types for presets.mjs (build-time AI request builders). See pixel-metrics.d.mts for the
// pattern: hand-written .d.mts next to the .mjs so TS consumers (tests) get real types.
export type AiBody = {
  name?: string;
  model?: string;
  aspect_ratio?: string;
  resolution?: string;
  image_count?: number;
  end_seconds?: number;
  audio?: boolean;
  style: { prompt: string; tool?: string };
  assets?: { image_file_paths?: string[]; image_file_path?: string; end_image_file_path?: string };
  [k: string]: unknown;
};
export type AiRequest = { endpoint: string; body: AiBody };

export const API_BASE: string;
export const MODELS: Record<"image" | "edit" | "video", { default: string; alts: string[] }>;
export const FRAG: Record<string, string>;

export function imageRequest(o: {
  prompt: string;
  aspect?: string;
  model?: string;
  count?: number;
  realism?: boolean;
  headroom?: boolean;
  resolution?: string;
  name?: string;
}): AiRequest;

export function editRequest(o: {
  imageUrl: string;
  instruction: string;
  model?: string;
  aspect?: string;
  resolution?: string;
  name?: string;
  newScene?: boolean;
}): AiRequest;

export function videoRequest(o: {
  imageUrl: string;
  motion: string;
  model?: string;
  seconds?: number;
  resolution?: string;
  static?: boolean;
  audio?: boolean;
  name?: string;
  endImageUrl?: string;
}): AiRequest;

export const PRESETS: Record<string, (...args: never[]) => AiRequest>;
