import React from "react";

/**
 * The Vostok-ish rocket silhouette in the brand red/gold — ported verbatim from
 * zarya-terminal's RocketLaunch.tsx so the promo's rocket IS the app's rocket.
 * Pure SVG, no state; scale via width/height.
 */
export const RocketMark: React.FC<{ width?: number; height?: number; glow?: boolean }> = ({
  width = 64,
  height = 120,
  glow = false,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 64 120"
    fill="none"
    aria-hidden
    style={glow ? { filter: "drop-shadow(0 0 18px rgba(226,35,26,0.55))" } : undefined}
  >
    <defs>
      <linearGradient id="zy-rk-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#F2E9D6" />
        <stop offset="1" stopColor="#C9BFA6" />
      </linearGradient>
    </defs>
    <path
      d="M32 4c11 12 15 26 15 40v34H17V44C17 30 21 16 32 4z"
      fill="url(#zy-rk-body)"
      stroke="#0A0E1A"
      strokeWidth="1.5"
    />
    <path d="M17 62L6 84l11-6zM47 62l11 22-11-6z" fill="#E2231A" stroke="#0A0E1A" strokeWidth="1.5" />
    <circle cx="32" cy="40" r="7" fill="#0A0E1A" stroke="#E0B15A" strokeWidth="2" />
    <circle cx="32" cy="40" r="2.6" fill="#4FD6D6" />
    <path d="M22 84h20l-3 10H25z" fill="#E2231A" stroke="#0A0E1A" strokeWidth="1.5" />
    <rect x="27" y="52" width="10" height="3" fill="#E2231A" />
  </svg>
);

/**
 * The little app-icon rocket badge (red rounded square with a pixel rocket),
 * as seen top-left in the titlebar. Pixel-crisp.
 */
export const RocketBadge: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.22,
      background: "#e2231a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 0 10px rgba(226,35,26,0.5)",
      flexShrink: 0,
    }}
  >
    <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 16 16" shapeRendering="crispEdges">
      <rect x="7" y="1" width="2" height="2" fill="#f2e9d6" />
      <rect x="6" y="3" width="4" height="7" fill="#f2e9d6" />
      <rect x="7" y="4" width="2" height="2" fill="#0a0e1a" />
      <rect x="4" y="7" width="2" height="3" fill="#0a0e1a" />
      <rect x="10" y="7" width="2" height="3" fill="#0a0e1a" />
      <rect x="6" y="10" width="4" height="2" fill="#e0b15a" />
      <rect x="7" y="12" width="2" height="3" fill="#f0662e" />
    </svg>
  </div>
);
