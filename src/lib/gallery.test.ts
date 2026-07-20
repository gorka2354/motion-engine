import { describe, expect, it } from "vitest";
import {
  absolutize,
  dedupe,
  extractCandidates,
  filterCandidates,
  galleryFromHtml,
  pickBestPerView,
  pickFromSrcset,
  robotsAllows,
} from "../../scripts/gallery.mjs";

/**
 * The parsing half of "collect reference views from a product page".
 *
 * All of it runs on strings — no network, no browser — which is exactly why the split exists:
 * page-scraping logic that can only be tested against a live site is logic that never gets
 * tested. `fetch-views.mjs` keeps the I/O; everything decision-making lives here.
 */
const BASE = "https://shop.example.com/products/thing";

describe("absolutize", () => {
  it("resolves relative, root-relative and protocol-relative URLs", () => {
    expect(absolutize(BASE, "a.png")).toBe("https://shop.example.com/products/a.png");
    expect(absolutize(BASE, "/img/a.png")).toBe("https://shop.example.com/img/a.png");
    expect(absolutize(BASE, "//cdn.example.com/a.png")).toBe("https://cdn.example.com/a.png");
  });
  it("rejects inline and unusable sources", () => {
    // a data: URI is already the bytes — there is nothing to fetch, and it is never a product photo
    expect(absolutize(BASE, "data:image/png;base64,iVBOR")).toBeNull();
    expect(absolutize(BASE, "blob:whatever")).toBeNull();
    expect(absolutize(BASE, "")).toBeNull();
    expect(absolutize(BASE, null)).toBeNull();
  });
});

describe("pickFromSrcset", () => {
  it("takes the LARGEST entry, not the first", () => {
    // the trap: product pages list the thumbnail first, so first-wins grabs the worst image
    const set = "small.jpg 320w, medium.jpg 800w, large.jpg 1600w";
    expect(pickFromSrcset(set)).toBe("large.jpg");
  });
  it("handles density descriptors", () => {
    expect(pickFromSrcset("a.jpg 1x, b.jpg 3x")).toBe("b.jpg");
  });
  it("survives a bare srcset with no descriptors", () => {
    expect(pickFromSrcset("only.jpg")).toBe("only.jpg");
  });
  it("returns null on empty input", () => {
    expect(pickFromSrcset("")).toBeNull();
    expect(pickFromSrcset(null)).toBeNull();
  });
});

describe("extractCandidates", () => {
  it("reads img, picture/source, og:image and JSON-LD", () => {
    const html = `
      <meta property="og:image" content="/media/hero.jpg">
      <picture><source srcset="/media/front-400.jpg 400w, /media/front-1600.jpg 1600w"></picture>
      <img src="/media/side.jpg">
      <script type="application/ld+json">
        {"@type":"Product","image":["/media/top.jpg","/media/back.jpg"]}
      </script>`;
    const urls = extractCandidates(html, BASE).map((c) => c.url);
    expect(urls).toContain("https://shop.example.com/media/hero.jpg");
    expect(urls).toContain("https://shop.example.com/media/front-1600.jpg"); // largest, not 400w
    expect(urls).toContain("https://shop.example.com/media/side.jpg");
    expect(urls).toContain("https://shop.example.com/media/top.jpg");
    expect(urls).toContain("https://shop.example.com/media/back.jpg");
  });
  it("reads a single-string JSON-LD image field", () => {
    const html = `<script type="application/ld+json">{"image":"/media/solo.jpg"}</script>`;
    expect(extractCandidates(html, BASE).map((c) => c.url)).toContain(
      "https://shop.example.com/media/solo.jpg",
    );
  });
  it("returns nothing for a page with no images", () => {
    expect(extractCandidates("<p>hello</p>", BASE)).toEqual([]);
  });
});

describe("filterCandidates", () => {
  it("drops sprites, icons, logos and SVGs", () => {
    const kept = filterCandidates(
      [
        "/media/product-front.jpg",
        "/assets/sprite.png",
        "/assets/logo.svg",
        "/i/cart-icon.png",
        "/media/nav-banner.jpg",
      ].map((url) => ({ url: `https://shop.example.com${url}`, source: "img" })),
    ).map((c) => c.url);
    expect(kept).toEqual(["https://shop.example.com/media/product-front.jpg"]);
  });
  it("keeps extension-less CDN URLs that sit under a media path", () => {
    const kept = filterCandidates([
      { url: "https://cdn.example.com/images/abc123", source: "og" },
    ]);
    expect(kept).toHaveLength(1);
  });
});

describe("dedupe", () => {
  it("treats the same path at different sizes as one photo", () => {
    const list = [
      { url: "https://cdn.example.com/a.jpg?width=400", source: "img" },
      { url: "https://cdn.example.com/a.jpg?width=1600", source: "srcset" },
      { url: "https://cdn.example.com/b.jpg", source: "img" },
    ];
    expect(dedupe(list).map((c) => c.url)).toEqual([
      "https://cdn.example.com/a.jpg?width=400",
      "https://cdn.example.com/b.jpg",
    ]);
  });
});

describe("galleryFromHtml", () => {
  it("runs the whole pipeline and caps the result", () => {
    const html = Array.from({ length: 40 }, (_, i) => `<img src="/media/p${i}.jpg">`).join("");
    expect(galleryFromHtml(html, BASE, 5)).toHaveLength(5);
  });
});

describe("robotsAllows", () => {
  it("honours a Disallow that covers the path", () => {
    const r = robotsAllows("User-agent: *\nDisallow: /products", "/products/thing");
    expect(r.allowed).toBe(false);
  });
  it("ignores rules written for a different agent", () => {
    const r = robotsAllows("User-agent: BadBot\nDisallow: /", "/products/thing");
    expect(r.allowed).toBe(true);
  });
  it("treats an empty Disallow as 'everything permitted', not 'everything blocked'", () => {
    // the classic bug: "Disallow:" with no value prefix-matches "" and blocks the whole site
    const r = robotsAllows("User-agent: *\nDisallow:", "/products/thing");
    expect(r.allowed).toBe(true);
  });
  it("lets a more specific Allow override a broad Disallow", () => {
    const r = robotsAllows(
      "User-agent: *\nDisallow: /\nAllow: /products/",
      "/products/thing",
    );
    expect(r.allowed).toBe(true);
  });
  it("keeps the Disallow when it is the more specific rule", () => {
    const r = robotsAllows(
      "User-agent: *\nAllow: /\nDisallow: /products/secret",
      "/products/secret/thing",
    );
    expect(r.allowed).toBe(false);
  });
  it("ignores comments and blank lines", () => {
    const r = robotsAllows("# comment\n\nUser-agent: *\nDisallow: /admin # trailing", "/products");
    expect(r.allowed).toBe(true);
  });
  it("permits when robots.txt is missing or empty", () => {
    expect(robotsAllows("", "/x").allowed).toBe(true);
    expect(robotsAllows(null, "/x").allowed).toBe(true);
  });
});

describe("pickBestPerView", () => {
  it("keeps the highest-confidence image for each view", () => {
    const picked = pickBestPerView([
      { url: "a", source: "img", view: "front", confidence: 0.6, area: 100 },
      { url: "b", source: "img", view: "front", confidence: 0.9, area: 100 },
      { url: "c", source: "img", view: "side", confidence: 0.7, area: 100 },
    ]);
    expect(picked.front.url).toBe("b");
    expect(picked.side.url).toBe("c");
  });
  it("breaks ties on pixel area — a bigger correct view traces better", () => {
    const picked = pickBestPerView([
      { url: "small", source: "img", view: "front", confidence: 0.8, area: 10_000 },
      { url: "big", source: "img", view: "front", confidence: 0.8, area: 900_000 },
    ]);
    expect(picked.front.url).toBe("big");
  });
  it("drops unclassifiable images instead of guessing a view for them", () => {
    const picked = pickBestPerView([
      { url: "x", source: "img", view: "unknown", confidence: 0, area: 500 },
    ]);
    expect(Object.keys(picked)).toEqual([]);
  });
});
