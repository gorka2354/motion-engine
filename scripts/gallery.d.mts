// Types for gallery.mjs so tsc can check the tests that import it.
export type Candidate = { url: string; source: string };
export type Classified = Candidate & {
  view?: string;
  confidence?: number;
  area?: number;
  file?: string;
};

export function absolutize(baseUrl: string, url: string | null | undefined): string | null;
export function pickFromSrcset(srcset: string | null | undefined): string | null;
export function extractCandidates(html: string, baseUrl: string): Candidate[];
export function filterCandidates(candidates: Candidate[]): Candidate[];
export function dedupe(candidates: Candidate[]): Candidate[];
export function robotsAllows(
  body: string | null | undefined,
  pathname: string,
): { allowed: boolean; why: string };
export function galleryFromHtml(html: string, baseUrl: string, limit?: number): Candidate[];
export function pickBestPerView(classified: Classified[]): Record<string, Classified>;
