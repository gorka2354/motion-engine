// Types for ai-gen.mjs (CLI) — the pure arg/request helpers used by tests.
import type { AiRequest } from "./ai/presets.d.mts";

export function parseArgs(argv: string[]): { kind: string; o: Record<string, string | boolean> };
export function buildRequest(
  kind: string,
  o: Record<string, string | boolean | undefined>,
): { req: AiRequest; pollKind: "image" | "video" };
