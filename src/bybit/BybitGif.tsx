import React, { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { DoubleSide, Mesh, MeshStandardMaterial } from "three";
import type { Group } from "three";
import { theme } from "../theme";
import { StageBackground } from "../lib/StageBackground";
import { Environment3D } from "../lib/Environment3D";
import { useGltf } from "../lib/useGltf";
import { TypoBeat } from "../v2/TypoBeat";

export const BYBIT_GIF_DURATION = 300; // 10s @ 30fps, seamless loop

/**
 * Telegram-post loop: the 3D Bybit card slowly spins (one full turn =
 * clip length → seamless loop) while chips of «unavailable from RF»
 * services orbit it — back half renders UNDER the canvas, front half
 * above, so the orbit truly wraps around the card. RU copy on top.
 */

// ── service logos (inline, recognizable marks) ──
const ClaudeMark: React.FC = () => (
  <svg width="58" height="58" viewBox="0 0 24 24">
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
  <svg width="58" height="58" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11" fill="#1DB954" />
    <g stroke="#0B0C0E" fill="none" strokeLinecap="round">
      <path d="M6.5 9.6 C 11 8.4 15.5 8.9 18.3 10.6" strokeWidth="2.1" />
      <path d="M7.2 12.8 C 10.8 11.9 14.4 12.3 16.8 13.7" strokeWidth="1.8" />
      <path d="M7.9 15.8 C 10.9 15.1 13.6 15.4 15.6 16.5" strokeWidth="1.5" />
    </g>
  </svg>
);

const YouTubeMark: React.FC = () => (
  <svg width="58" height="58" viewBox="0 0 24 24">
    <rect x="1.5" y="5" width="21" height="14" rx="4" fill="#FF0033" />
    <path d="M10 9 L 15.5 12 L 10 15 Z" fill="#fff" />
  </svg>
);

const NetflixMark: React.FC = () => (
  <svg width="58" height="58" viewBox="0 0 24 24">
    <rect x="5" y="3" width="3.6" height="18" fill="#B1060F" />
    <rect x="15.4" y="3" width="3.6" height="18" fill="#E50914" />
    <path d="M5 3 L 8.6 3 L 19 21 L 15.4 21 Z" fill="#E50914" />
  </svg>
);

const OpenAIMark: React.FC = () => (
  <Img
    src={staticFile("providers/openai.svg")}
    style={{ width: 56, height: 56, filter: "invert(1)" }}
  />
);

const SERVICES = [
  { label: "Claude", node: <ClaudeMark /> },
  { label: "ChatGPT", node: <OpenAIMark /> },
  { label: "Spotify", node: <SpotifyMark /> },
  { label: "YouTube", node: <YouTubeMark /> },
  { label: "Netflix", node: <NetflixMark /> },
];

const OrbitChips: React.FC<{ layer: "back" | "front" }> = ({ layer }) => {
  const f = useCurrentFrame();
  return (
    <>
      {SERVICES.map((s, i) => {
        const a = (i / SERVICES.length) * Math.PI * 2 + (f / BYBIT_GIF_DURATION) * Math.PI * 2;
        const depth = Math.sin(a); // >0 → front
        if (layer === "front" ? depth < 0 : depth >= 0) return null;
        const x = 540 + Math.cos(a) * 402;
        const y = 610 + depth * 148;
        const k = 0.78 + 0.3 * (depth * 0.5 + 0.5);
        return (
          <div
            key={s.label}
            style={{
              position: "absolute",
              left: x,
              top: y,
              translate: "-50% -50%",
              scale: String(k),
              opacity: 0.62 + 0.38 * (depth * 0.5 + 0.5),
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 128,
                height: 128,
                borderRadius: 32,
                background: "rgba(18,19,24,0.94)",
                border: `1px solid ${theme.bybit.hair}`,
                boxShadow: theme.dark.shadowFloat,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {s.node}
            </div>
            <div
              style={{
                fontFamily: theme.font.family,
                fontSize: 22,
                fontWeight: 700,
                color: theme.bybit.textMuted,
              }}
            >
              {s.label}
            </div>
          </div>
        );
      })}
    </>
  );
};

const Card3D: React.FC<{ scene: Group }> = ({ scene }) => {
  const f = useCurrentFrame();
  // one full turn per clip → seamless loop
  const spin = (f / BYBIT_GIF_DURATION) * Math.PI * 2 - 0.35;
  return (
    <group rotation={[0.08, spin, 0]} position={[0, 0.12, 0]} scale={0.62}>
      {/* the GLB card lies flat — stand it up facing the camera */}
      <primitive object={scene} rotation={[Math.PI / 2 + 0.06, 0, 0]} />
    </group>
  );
};

export const BybitGif: React.FC = () => {
  const { width, height } = useVideoConfig();
  const gltf = useGltf(staticFile("models/bybit-card.glb"));
  const scene = useMemo(() => {
    if (!gltf) return null;
    gltf.scene.traverse((o) => {
      if (o instanceof Mesh && o.material instanceof MeshStandardMaterial) {
        o.material.side = DoubleSide;
      }
    });
    return gltf.scene;
  }, [gltf]);

  const by = theme.bybit;
  const beatColors = { color: by.text, subColor: by.textMuted, accentColor: by.accent };

  return (
    <StageBackground bg={by.bg} glowA={by.accent} glowB={by.accentDeep} glowOpacity={0.16}>
      {/* warm glow behind the card */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "56%",
          translate: "-50% -50%",
          width: 820,
          height: 620,
          background: by.glow,
          filter: "blur(50px)",
        }}
      />

      {/* orbit — back half under the canvas */}
      <OrbitChips layer="back" />

      <AbsoluteFill>
        <ThreeCanvas width={width} height={height} camera={{ fov: 35, position: [0, 0.5, 5.2] }}>
          <Environment3D intensity={0.55} />
          <ambientLight intensity={0.3} />
          <pointLight position={[4, 4, 4]} intensity={200} color="#FFE3A6" />
          <pointLight position={[-4, 2, -2]} intensity={120} color={by.accent} />
          {scene ? <Card3D scene={scene} /> : null}
        </ThreeCanvas>
      </AbsoluteFill>

      {/* orbit — front half above the canvas */}
      <OrbitChips layer="front" />

      {/* RU beats (loop-friendly windows) */}
      <TypoBeat
        title="Зарубежные сервисы — без карты РФ?"
        from={14}
        to={138}
        y={64}
        size={50}
        {...beatColors}
      />
      <TypoBeat
        title="Платит Bybit Card."
        sub="полный гайд — в посте ↓"
        from={158}
        to={286}
        y={64}
        size={56}
        accentWord="Bybit Card"
        {...beatColors}
      />
    </StageBackground>
  );
};
