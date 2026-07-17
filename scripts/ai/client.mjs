// Magic Hour REST client — the submit → poll → download loop I ran by hand via curl during
// the Level-Up build, now one reusable module. Uses Node's global fetch (Node 20). The API
// key is read from .env.local (gitignored) and never logged. Async project model: POST an
// endpoint → {id}, then GET the project until status:complete → downloads[].url.
import fs from "fs";
import path from "path";
import { API_BASE } from "./presets.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Read MAGICHOUR_API_KEY from a dotenv-style file. Throws if absent. */
export function readKey(envFile = ".env.local") {
  const m = fs.readFileSync(envFile, "utf8").match(/MAGICHOUR_API_KEY\s*=\s*(.+)/);
  if (!m) throw new Error(`MAGICHOUR_API_KEY not found in ${envFile}`);
  return m[1].trim();
}

/** image/edit projects live under image-projects; video under video-projects. Pure — tested. */
export const projectPath = (kind) => (kind === "video" ? "video-projects" : "image-projects");

/** Pick the real asset URL from a completed project's downloads (prefer a media extension). */
export const pickAssetUrl = (downloads = []) => {
  const urls = downloads.map((d) => d?.url).filter(Boolean);
  return urls.find((u) => /\.(mp4|jpg|jpeg|png|webp)(\?|$)/i.test(u)) || urls[0] || null;
};

async function api(url, { method = "GET", key, body } = {}) {
  const res = await fetch(url, {
    method,
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${url} → ${res.status} ${await res.text().catch(() => "")}`);
  return res.json();
}

/** POST a built request → { id, credits }. */
export async function submit(key, endpoint, body) {
  const r = await api(endpoint, { method: "POST", key, body });
  return { id: r.id, credits: r.credits_charged ?? r.estimated_frame_cost ?? 0 };
}

/** Poll a project until it completes (or errors/times out). Returns { url, raw }. */
export async function poll(key, kind, id, { intervalMs = 5000, maxTries = 120, onTick } = {}) {
  for (let i = 0; i < maxTries; i++) {
    const p = await api(`${API_BASE}/${projectPath(kind)}/${id}`, { key });
    onTick?.(p.status, i);
    if (p.status === "complete") return { url: pickAssetUrl(p.downloads), raw: p };
    if (["error", "failed", "canceled"].includes(p.status))
      throw new Error(`project ${id} ${p.status}: ${JSON.stringify(p.error)}`);
    await sleep(intervalMs);
  }
  throw new Error(`project ${id} timed out after ${maxTries} polls`);
}

/** Download a URL to a file. Returns { file, bytes }. */
export async function download(url, file) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${url} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
  return { file, bytes: buf.length };
}

/** High-level: submit → poll → download. `kind` is "image" | "edit" | "video". */
export async function generate(key, kind, req, outFile, opts = {}) {
  const { id, credits } = await submit(key, req.endpoint, req.body);
  const { url } = await poll(key, kind, id, opts);
  const { bytes } = await download(url, outFile);
  return { id, credits, file: outFile, bytes, url };
}
