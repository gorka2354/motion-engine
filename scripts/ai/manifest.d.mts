// Types for manifest.mjs (AI asset cache).
export type ManifestEntry = { file?: string; id?: string; credits?: number; bytes?: number; kind?: string };
export type Manifest = Record<string, ManifestEntry>;

export function hashKey(kind: string, payload: unknown): string;
export function loadManifest(file: string): Manifest;
export function saveManifest(file: string, data: Manifest): void;
export function lookup(manifest: Manifest, key: string, fileExists?: (p: string) => boolean): ManifestEntry | null;
export function record(manifest: Manifest, key: string, entry: ManifestEntry): Manifest;
