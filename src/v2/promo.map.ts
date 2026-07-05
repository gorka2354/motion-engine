import type { PromoProps } from "./promoSchema";

/**
 * The tixu.ai 44s master, expressed as data (inc-5). This is the default
 * value of the TixuPromoV2 composition — edit here (or override with
 * `npx remotion render TixuPromoV2 --props=file.json`) to re-author the
 * video without touching JSX. All frames are absolute @ 30fps.
 */
export const PROMO_DEFAULTS: PromoProps = {
  brand: {
    logo: "logo.svg",
    ctaLabel: "Start free · tixu.ai",
    endTitleLines: ["Learn AI.", "Actually use it."],
  },
  beats: [
    { title: "Everyone has AI.", from: 8, to: 54, y: 290, size: "hero" },
    {
      title: "Few use it well.",
      accentWord: "well",
      from: 50,
      to: 104,
      y: 290,
      size: "hero",
    },
    {
      title: "A plan that knows you.",
      sub: "Your focus, your goal, your pace.",
      from: 158,
      to: 250,
      y: 168,
      size: "beat",
    },
    {
      title: "Courses, challenges, careers.",
      sub: "A track for whatever you're after.",
      from: 273,
      to: 405,
      y: 168,
      size: "beatWide",
    },
    {
      title: "One clear path.",
      sub: "Chapters, lessons, a certificate.",
      from: 428,
      to: 495,
      y: 168,
      size: "beat",
    },
    {
      title: "Finish certified.",
      sub: "A personal certificate for every course.",
      from: 815,
      to: 905,
      y: 168,
      size: "beat",
    },
    {
      title: "Every AI. One app.",
      sub: "ChatGPT · Gemini · Runway · Flux — built in.",
      from: 920,
      to: 1130,
      y: 168,
      size: "beat",
    },
  ],
  zoomBeat: { title: "Learn by doing.", from: 591, to: 700, y: 96, size: "beatZoom" },
  nav: [
    { at: 0, kind: "push", screen: "home" },
    { at: 150, kind: "push", screen: "profile" },
    { at: 265, kind: "push", screen: "library" },
    { at: 420, kind: "push", screen: "path" },
    { at: 585, kind: "push", screen: "quiz" },
    { at: 910, kind: "tab", screen: "tools" },
  ],
  floats: {
    certificate: { from: 810, to: 905 },
    chips: { from: 935, to: 1010 },
  },
};
