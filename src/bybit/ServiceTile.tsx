import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";

/**
 * Service tile face (520×520, alpha squircle) — frame index = service, so
 * `npm run stills BybitServiceTile 0,1,2,3,4` bakes all five textures in
 * one run. Baked onto extruded 3D tiles in Blender (bybit-tiles.py).
 */

const ClaudeMark: React.FC = () => (
  <svg width="300" height="300" viewBox="0 0 24 24">
    {Array.from({ length: 8 }, (_, i) => (
      <line
        key={i}
        x1="12"
        y1="12"
        x2={12 + 9 * Math.cos((i * Math.PI) / 4 + Math.PI / 8)}
        y2={12 + 9 * Math.sin((i * Math.PI) / 4 + Math.PI / 8)}
        stroke="#D97757"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    ))}
  </svg>
);

const SpotifyMark: React.FC = () => (
  <svg width="300" height="300" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11" fill="#1DB954" />
    <g stroke="#0B0C0E" fill="none" strokeLinecap="round">
      <path d="M6.5 9.6 C 11 8.4 15.5 8.9 18.3 10.6" strokeWidth="2.1" />
      <path d="M7.2 12.8 C 10.8 11.9 14.4 12.3 16.8 13.7" strokeWidth="1.8" />
      <path d="M7.9 15.8 C 10.9 15.1 13.6 15.4 15.6 16.5" strokeWidth="1.5" />
    </g>
  </svg>
);

const YouTubeMark: React.FC = () => (
  <svg width="300" height="300" viewBox="0 0 24 24">
    <rect x="1.5" y="5" width="21" height="14" rx="4" fill="#FF0033" />
    <path d="M10 9 L 15.5 12 L 10 15 Z" fill="#fff" />
  </svg>
);

const NetflixMark: React.FC = () => (
  <svg width="300" height="300" viewBox="0 0 24 24">
    <rect x="5" y="3" width="3.6" height="18" fill="#B1060F" />
    <rect x="15.4" y="3" width="3.6" height="18" fill="#E50914" />
    <path d="M5 3 L 8.6 3 L 19 21 L 15.4 21 Z" fill="#E50914" />
  </svg>
);

const OpenAIMark: React.FC = () => (
  <Img src={staticFile("providers/openai.svg")} style={{ width: 290, height: 290, filter: "invert(1)" }} />
);

export const TILE_SERVICES = [
  { label: "Claude", node: <ClaudeMark /> },
  { label: "ChatGPT", node: <OpenAIMark /> },
  { label: "Spotify", node: <SpotifyMark /> },
  { label: "YouTube", node: <YouTubeMark /> },
  { label: "Netflix", node: <NetflixMark /> },
];

export const ServiceTile: React.FC = () => {
  const f = useCurrentFrame();
  const s = TILE_SERVICES[f % TILE_SERVICES.length];
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 124,
          background: "linear-gradient(140deg, #1B1C22 0%, #101116 60%, #0C0D11 100%)",
          border: "2px solid rgba(255,255,255,0.09)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {s.node}
      </div>
    </AbsoluteFill>
  );
};
