// Types for client.mjs (Magic Hour REST client).
import type { AiRequest } from "./presets.d.mts";

export type PollOpts = { intervalMs?: number; maxTries?: number; onTick?: (status: string, i: number) => void };
export type GenResult = { id: string; credits: number; file: string; bytes: number; url: string };

export function readKey(envFile?: string): string;
export function projectPath(kind: string): "image-projects" | "video-projects";
export function pickAssetUrl(downloads?: Array<{ url?: string }>): string | null;
export function submit(key: string, endpoint: string, body: unknown): Promise<{ id: string; credits: number }>;
export function poll(key: string, kind: string, id: string, opts?: PollOpts): Promise<{ url: string | null; raw: unknown }>;
export function download(url: string, file: string): Promise<{ file: string; bytes: number }>;
export function generate(key: string, kind: string, req: AiRequest, outFile: string, opts?: PollOpts): Promise<GenResult>;
