// Asset cache — maps a request (kind + body) to the id/file it produced, so re-running a
// generation with identical params is a cache HIT instead of a paid API call. The Level-Up
// run cost ~900 credits partly from re-generating the same thing while iterating; this makes
// that free. Pure hashing/lookup here (testable); the CLI does the file I/O around it.
import fs from "fs";
import path from "path";

/**
 * Stable content hash of a request → cache key. Same (kind, payload) always yields the same
 * key (djb2), so an unchanged request hits the cache. Order-sensitive on purpose: the body
 * is JSON-stringified as given.
 * @param {string} kind  e.g. "image" | "edit" | "video"
 * @param {unknown} payload  the request body (or any JSON-serializable descriptor)
 * @returns {string}
 */
export function hashKey(kind, payload) {
  const s = kind + ":" + JSON.stringify(payload);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return `${kind}_${h.toString(36)}`;
}

/** Load a manifest JSON, or {} if missing/corrupt (never throws — a bad cache is just a miss). */
export function loadManifest(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}

/** Persist a manifest (pretty JSON), creating the dir if needed. */
export function saveManifest(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

/**
 * Return the cached entry for a key, but only if its file still exists on disk — a manifest
 * row whose asset was deleted (e.g. `out/` cleaned) must count as a MISS, not a false hit.
 * @param {Record<string, {file?:string}>} manifest
 * @param {string} key
 * @param {(p:string)=>boolean} [fileExists]  injectable for tests (default fs.existsSync)
 * @returns {object|null}
 */
export function lookup(manifest, key, fileExists = fs.existsSync) {
  const e = manifest[key];
  if (!e) return null;
  if (e.file && !fileExists(e.file)) return null;
  return e;
}

/** Record an entry under a key (mutates + returns the manifest). `at` is passed in, not read
 * from the clock, so this stays a pure function for tests. */
export function record(manifest, key, entry) {
  manifest[key] = { ...entry };
  return manifest;
}
