import type { PromoProps } from "../v2/promoSchema";

/**
 * Lumo 44s master, expressed as data (the shared FloatingPhonePromo engine).
 * Fictional EdTech brand with original copy. All frames absolute @ 30fps.
 * `brand.logo` is unused (Lumo renders a text wordmark) — kept to satisfy the
 * shared schema.
 */
export const LUMO_DEFAULTS: PromoProps = {
  brand: {
    logo: "", // unused — Lumo renders a text wordmark, not an image
    ctaLabel: "Start free · lumo.app",
    endTitleLines: ["Get good at AI.", "For real."],
  },
  beats: [
    { title: "Anyone can use AI.", from: 8, to: 54, y: 290, size: "hero" },
    {
      title: "Few get good.",
      accentWord: "good",
      from: 50,
      to: 104,
      y: 290,
      size: "hero",
    },
    {
      title: "A plan built for you.",
      sub: "Your goal, your level, your pace.",
      from: 158,
      to: 250,
      y: 168,
      size: "beat",
    },
    {
      title: "Skills, challenges, careers.",
      sub: "A track for whatever you're after.",
      from: 273,
      to: 405,
      y: 168,
      size: "beatWide",
    },
    {
      title: "One path to follow.",
      sub: "Chapters, lessons, then a certificate.",
      from: 428,
      to: 495,
      y: 168,
      size: "beat",
    },
    {
      title: "Earn your certificate.",
      sub: "One for every course you finish.",
      from: 815,
      to: 905,
      y: 168,
      size: "beat",
    },
    {
      title: "All your AI in one place.",
      sub: "ChatGPT · Claude · Gemini · Runway — built in.",
      from: 920,
      to: 1130,
      y: 168,
      size: "beat",
    },
  ],
  zoomBeat: {
    title: "Hands-on, every step.",
    from: 591,
    to: 700,
    y: 96,
    size: "beatZoom",
  },
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
