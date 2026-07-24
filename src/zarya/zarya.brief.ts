import type { Brief } from "../v2/briefSchema";

/**
 * Analyzer brief reconstructed from the shipped Zarya promo (src/zarya).
 * Product: zarya-terminal — a Warp-like environment for working with the agent,
 * with a side IDE as a secondary feature. Hero = sessions surviving a PC power
 * cycle. `palette.accent` is written literally so the drift-guard bites.
 */
export const ZARYA_BRIEF: Brief = {
  product: { name: "Заря", url: "github.com/gorka2354/zarya-terminal" },
  category: "product-tour",
  framework: "hook-demo-benefits-cta",
  palette: {
    accent: "#e2231a", // must equal theme.zarya.accent (Soviet red)
    bgFamily: "deep-space navy",
    glowAlpha: 0.3,
  },
  features: [
    { label: "Единый ввод для агента", rank: 1, isHero: false },
    { label: "Агент отвечает прямо в терминале", rank: 2, isHero: false },
    { label: "Строка морфится в варианты выбора", rank: 3, isHero: false },
    { label: "Встроенная IDE сбоку", rank: 4, isHero: false },
    { label: "Сессии переживают выключение ПК", rank: 5, isHero: true },
  ],
  heroBeat: {
    feature: "Сессии переживают выключение ПК",
    why: "главная боль — много сессий по проектам; выключил ПК, включил — всё на месте",
  },
  copy: {
    headline: "Всё остаётся у тебя",
    cta: "ПОЕХАЛИ",
    lines: [
      "Единый ввод — не терминал, а разговор с агентом.",
      "Ответ агента — прямо в потоке.",
      "Строка сама становится выбором.",
    ],
  },
  assets: [
    "zarya/logo-rocket-48.png",
    "zarya/logo-zarya-64.png",
    "zarya/pixel-frame-dark.png",
  ],
};
