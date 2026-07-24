import type { Brief } from "../v2/briefSchema";

/**
 * Analyzer brief reconstructed from the shipped Lumo 44s master (src/lumo).
 * Fictional EdTech brand — original copy. `palette.accent` is written literally
 * (not imported from tokens) so the brief.test.ts drift-guard actually catches
 * a token/brief divergence.
 */
export const LUMO_BRIEF: Brief = {
  product: { name: "Lumo", url: "lumo.app" },
  category: "product-tour",
  framework: "hook-demo-benefits-cta",
  palette: {
    accent: "#FB7185", // must equal theme.lumo.accent
    bgFamily: "rose-dark",
    glowAlpha: 0.42,
  },
  features: [
    { label: "A plan built for you", rank: 1, isHero: false },
    { label: "Skills, challenges, careers", rank: 2, isHero: false },
    { label: "One path to a certificate", rank: 3, isHero: false },
    { label: "All your AI in one place", rank: 4, isHero: true },
  ],
  heroBeat: {
    feature: "All your AI in one place",
    why: "the payoff — every major model built in, no tab-juggling",
  },
  copy: {
    headline: "Get good at AI. For real.",
    cta: "Start free · lumo.app",
    lines: [
      "Anyone can use AI.",
      "Few get good.",
      "A plan built for you.",
      "Earn your certificate.",
    ],
  },
  assets: [],
};
