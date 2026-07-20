// Pure parsing helpers for pulling a product gallery off a page. No network, no browser — all
// the I/O lives in fetch-views.mjs, so this half is unit-testable on plain strings.
//
// WHY A GALLERY AND NOT A SEARCH: reverse image search cannot find "the same object from another
// angle" — TinEye's own docs say it "cannot be used for identifying 3D objects", and perceptual
// hashes only match near-duplicates of one file. But a product page already HAS the other angles
// sitting in its gallery. So the useful move is not searching for views, it's collecting them.

/** Resolve a possibly-relative URL against the page it came from. Returns null if unusable. */
export function absolutize(baseUrl, url) {
  if (!url) return null;
  const trimmed = String(url).trim();
  if (!trimmed || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return null;
  try {
    return new URL(trimmed, baseUrl).href;
  } catch {
    return null;
  }
}

/**
 * Largest candidate out of a `srcset`. Product pages serve thumbnails and full-size from the same
 * attribute; taking the first entry would reliably grab the smallest one.
 * Handles both width (`800w`) and density (`2x`) descriptors.
 */
export function pickFromSrcset(srcset) {
  if (!srcset) return null;
  const entries = String(srcset)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [url, descriptor] = part.split(/\s+/);
      if (!url) return null;
      let weight = 1;
      if (descriptor?.endsWith("w")) weight = parseFloat(descriptor);
      else if (descriptor?.endsWith("x")) weight = parseFloat(descriptor) * 1000;
      return { url, weight: Number.isFinite(weight) ? weight : 1 };
    })
    .filter(Boolean);
  if (entries.length === 0) return null;
  return entries.reduce((a, b) => (b.weight > a.weight ? b : a)).url;
}

const IMAGE_EXT = /\.(png|jpe?g|webp|avif)(\?|$)/i;
/** Sprites, icons, logos, badges, placeholders — never the product itself. */
const JUNK = /(sprite|icon|logo|badge|placeholder|thumb-?nail|avatar|favicon|banner|pixel)/i;

/**
 * Candidate images from a page's HTML, in document order.
 *
 * Reads `<img src>`/`srcset`, `<source srcset>` (picture elements), `og:image` and JSON-LD
 * `image` fields — the four places product photos actually live. Deliberately regex-based rather
 * than a DOM parser: this runs on a string and must not pull a parser dependency for the sake of
 * four patterns.
 */
export function extractCandidates(html, baseUrl) {
  const out = [];
  const push = (url, source) => {
    const abs = absolutize(baseUrl, url);
    if (abs) out.push({ url: abs, source });
  };

  for (const tag of html.match(/<(?:img|source)\b[^>]*>/gi) ?? []) {
    const srcset = tag.match(/\bsrcset\s*=\s*["']([^"']+)["']/i)?.[1];
    const best = pickFromSrcset(srcset);
    if (best) push(best, "srcset");
    const src = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
    if (src) push(src, "img");
  }
  for (const m of html.matchAll(
    /<meta\b[^>]*property\s*=\s*["']og:image[^"']*["'][^>]*content\s*=\s*["']([^"']+)["']/gi,
  )) {
    push(m[1], "og");
  }
  for (const block of html.match(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) ??
    []) {
    const body = block.replace(/^[\s\S]*?>/, "").replace(/<\/script>$/i, "");
    for (const m of body.matchAll(/"(?:image|contentUrl)"\s*:\s*"([^"]+)"/g)) push(m[1], "ld+json");
    for (const m of body.matchAll(/"(?:image|contentUrl)"\s*:\s*\[([^\]]+)\]/g)) {
      for (const inner of m[1].matchAll(/"([^"]+)"/g)) push(inner[1], "ld+json");
    }
  }
  return out;
}

/** Drop icons, sprites, SVGs and anything that isn't plausibly a photo. */
export function filterCandidates(candidates) {
  return candidates.filter(({ url }) => {
    if (JUNK.test(url)) return false;
    if (/\.svg(\?|$)/i.test(url)) return false;
    // og: and ld+json URLs often carry no extension but are still real photos
    return IMAGE_EXT.test(url) || /\/(image|photo|media|asset)s?\//i.test(url);
  });
}

/**
 * Collapse duplicates. Same path at different sizes is still one photo, so comparison ignores
 * the query string — that is where most CDNs put `?width=`.
 */
export function dedupe(candidates) {
  const seen = new Set();
  const out = [];
  for (const c of candidates) {
    const key = c.url.split("?")[0];
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

/**
 * Does robots.txt permit fetching `pathname` as an anonymous agent?
 *
 * Deliberately small: only the `User-agent: *` group, `Disallow`/`Allow`, longest-match wins
 * (as the standard specifies — a specific `Allow` overrides a broader `Disallow`). No wildcard
 * expansion, no crawl-delay. If a site's rules are more intricate than this can model, the
 * honest answer is to stop, which is what an unmatched Disallow already does.
 *
 * `Disallow:` with an empty value means "allow everything" and must not be read as a prefix
 * match on "" — that would block every path on the site.
 */
export function robotsAllows(body, pathname) {
  if (!body || !body.trim()) return { allowed: true, why: "empty robots.txt" };
  let inStar = false;
  const rules = [];
  for (const raw of String(body).split(/\r?\n/)) {
    const line = raw.split("#")[0].trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key === "user-agent") {
      inStar = value === "*";
    } else if (inStar && (key === "disallow" || key === "allow")) {
      if (!value) continue; // "Disallow:" with no path = no restriction
      rules.push({ allow: key === "allow", path: value });
    }
  }
  const matches = rules.filter((r) => pathname.startsWith(r.path));
  if (matches.length === 0) return { allowed: true, why: "robots.txt permits" };
  // longest match wins; Allow beats Disallow at equal length
  const winner = matches.reduce((a, b) => {
    if (b.path.length !== a.path.length) return b.path.length > a.path.length ? b : a;
    return b.allow ? b : a;
  });
  return winner.allow
    ? { allowed: true, why: `robots.txt allows ${winner.path}` }
    : { allowed: false, why: `robots.txt disallows ${winner.path}` };
}

/** Full pipeline over a page's HTML: extract → filter → dedupe. */
export function galleryFromHtml(html, baseUrl, limit = 24) {
  return dedupe(filterCandidates(extractCandidates(html, baseUrl))).slice(0, limit);
}

/**
 * Choose one image per viewpoint from classified candidates.
 *
 * Ranks by the classifier's confidence, then by pixel area — a bigger correct-view photo traces
 * better than a small one. Candidates whose view is `unknown` are dropped rather than guessed.
 */
export function pickBestPerView(classified) {
  const best = new Map();
  for (const item of classified) {
    if (!item.view || item.view === "unknown") continue;
    const current = best.get(item.view);
    const score = (item.confidence ?? 0) * 1e9 + (item.area ?? 0);
    if (!current || score > current._score) best.set(item.view, { ...item, _score: score });
  }
  return Object.fromEntries(
    [...best.entries()].map(([view, item]) => {
      const copy = { ...item };
      delete copy._score;
      return [view, copy];
    }),
  );
}
