import React from "react";
import { theme } from "../theme";

/**
 * Neutral, self-contained Lumo illustrations — no product screenshots or
 * third-party art. Coral gradient tiles + stroke glyphs, so every screen is
 * brand-owned and deterministic. Replaces the raster assets the original screens
 * used (backpack, lesson art, career/track/gen images).
 */

const L = theme.lumo;

export type IconName =
  | "spark"
  | "book"
  | "chat"
  | "target"
  | "clock"
  | "layers"
  | "trophy"
  | "image"
  | "video"
  | "music"
  | "text"
  | "pen"
  | "megaphone"
  | "rocket"
  | "cap"
  | "play"
  | "check";

const PATHS: Record<IconName, React.ReactNode> = {
  spark: (
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
  ),
  book: (
    <path d="M12 6.5C10 5 6.8 5 5 5.6V19c1.8-.6 5-.6 7 .9 2-1.5 5.2-1.5 7-.9V5.6C17.2 5 14 5 12 6.5Zm0 0V19.9" />
  ),
  chat: <path d="M4 5h16v11H9l-5 4V5Z" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.3l3 1.7" />
    </>
  ),
  layers: <path d="M12 4l8 4-8 4-8-4 8-4Zm8 8l-8 4-8-4m16 4l-8 4-8-4" />,
  trophy: (
    <path d="M7 5h10v3a5 5 0 0 1-10 0V5Zm0 1H4v1a3 3 0 0 0 3 3m10-4h3v1a3 3 0 0 1-3 3m-5 4v3m-3 3h6m-5 0 .5-3h3l.5 3" />
  ),
  image: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M5 17l4.5-4 3 2.5L16 12l3 3" />
    </>
  ),
  video: <path d="M4 6h11v12H4V6Zm11 4 5-3v10l-5-3" />,
  music: (
    <>
      <path d="M9 18V6l10-2v12" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="16.5" cy="16" r="2.5" />
    </>
  ),
  text: <path d="M5 6h14M5 6v-.5M12 6v13m-3 0h6" />,
  pen: <path d="M14 4l6 6L9 21l-5 1 1-5L14 4Zm-2 2 6 6" />,
  megaphone: <path d="M4 10v4l10 5V5L4 10Zm10 0 5-2v8l-5-2M8 15v3h3" />,
  rocket: (
    <>
      <path d="M12 2.5c2.4 1.8 3.8 4.7 3.8 7.8l-1.6 2.3H9.8l-1.6-2.3C8.2 7.2 9.6 4.3 12 2.5Z" />
      <circle cx="12" cy="8.6" r="1.3" />
      <path d="M9.8 12.6 7 15.4v1.8l2.6-1.4M14.2 12.6 17 15.4v1.8l-2.6-1.4" />
      <path d="M10.6 14.6 12 17.9l1.4-3.3" />
    </>
  ),
  cap: <path d="M3 9l9-4 9 4-9 4-9-4Zm4 2.5V16c0 1.5 2.5 3 5 3s5-1.5 5-3v-4.5" />,
  play: <path d="M8 5.5v13l11-6.5L8 5.5Z" />,
  check: <path d="M4 12.5l5 5 11-11" />,
};

const FILLED: Set<IconName> = new Set(["spark", "play"]);

/** A stroke (or fill) glyph. Inherits size + color. */
export const Icon: React.FC<{
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}> = ({ name, size = 24, color = "currentColor", strokeWidth = 2 }) => {
  const filled = FILLED.has(name);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : "none"}
      stroke={filled ? "none" : color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name]}
    </svg>
  );
};

/** Coral-gradient rounded tile with a white glyph — the course/track icon. */
export const GlyphTile: React.FC<{
  icon: IconName;
  size?: number;
  radius?: number;
}> = ({ icon, size = 62, radius = 16 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: radius,
      background: L.ctaGradient,
      boxShadow: `0 10px 22px -10px ${L.accentDeep}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <Icon name={icon} size={size * 0.5} color="#fff" strokeWidth={2.2} />
  </div>
);

/** Soft coral-tinted tile with a coral glyph — muted / not-started icon. */
export const TintTile: React.FC<{
  icon: IconName;
  size?: number;
  radius?: number;
}> = ({ icon, size = 58, radius = 16 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: radius,
      background: L.tint,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <Icon name={icon} size={size * 0.48} color={L.accentDeep} strokeWidth={2.2} />
  </div>
);

/**
 * Home hero art: a big soft coral orb with a spark — the "welcome back"
 * illustration in place of the original backpack render.
 */
export const HeroArt: React.FC<{ size?: number }> = ({ size = 210 }) => (
  <div
    style={{
      width: size,
      height: size,
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        background: "radial-gradient(closest-side, #FFE0E6, transparent 72%)",
      }}
    />
    <div
      style={{
        width: size * 0.62,
        height: size * 0.62,
        borderRadius: "38%",
        background: L.ctaGradient,
        boxShadow: `0 24px 50px -18px ${L.accentDeep}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        rotate: "-6deg",
      }}
    >
      <Icon name="spark" size={size * 0.34} color="#fff" />
    </div>
  </div>
);

/**
 * Lesson banner: a coral gradient panel with a soft glyph pattern — replaces
 * the original lesson illustration (person → robot → system).
 */
export const LessonBanner: React.FC<{ height?: number }> = ({ height = 232 }) => (
  <div
    style={{
      height,
      borderRadius: 20,
      overflow: "hidden",
      position: "relative",
      background: L.ctaGradient,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {/* faint oversized glyphs for texture */}
    <div style={{ position: "absolute", left: -20, top: -30, opacity: 0.16 }}>
      <Icon name="chat" size={150} color="#fff" strokeWidth={1.4} />
    </div>
    <div style={{ position: "absolute", right: -18, bottom: -34, opacity: 0.16 }}>
      <Icon name="spark" size={140} color="#fff" />
    </div>
    <div
      style={{
        width: 92,
        height: 92,
        borderRadius: 26,
        background: "rgba(255,255,255,0.22)",
        border: "1.5px solid rgba(255,255,255,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name="chat" size={46} color="#fff" strokeWidth={2.2} />
    </div>
  </div>
);

/**
 * Text wordmark "Lumo" (Manrope 800, coral final "o"). No SVG logo file —
 * the font is already loaded, so it renders crisp and deterministic. White on
 * the dark stage; pass a dark `color` for the light certificate card.
 */
export const LumoWordmark: React.FC<{ height: number; color?: string }> = ({
  height,
  color = "#FFFFFF",
}) => (
  <div
    style={{
      fontFamily: theme.font.family,
      fontSize: height * 1.02,
      fontWeight: 800,
      letterSpacing: "-0.03em",
      lineHeight: 1,
      color,
      display: "inline-flex",
    }}
  >
    Lum<span style={{ color: L.accent }}>o</span>
  </div>
);

/** Generate-card thumbnail: coral-toned gradient with the type glyph. */
export const GenThumb: React.FC<{ icon: IconName; grad: string }> = ({
  icon,
  grad,
}) => (
  <div
    style={{
      height: 92,
      borderRadius: 18,
      background: grad,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Icon name={icon} size={34} color="#fff" strokeWidth={2.2} />
  </div>
);
