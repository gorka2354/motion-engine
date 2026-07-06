import React, { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { DoubleSide, Mesh, MeshStandardMaterial } from "three";
import type { Group } from "three";
import { theme } from "../theme";
import { StageBackground } from "./StageBackground";
import { useGltf } from "./useGltf";
import { TypoBeat } from "../v2/TypoBeat";
import { clamp01, kf, SPRING } from "../v2/anim";

export const SHOWCASE_3D_DURATION = 300;

/**
 * 3D + the whole toolkit in one shot: the Blender GLB laptop rises on a
 * SPRING preset, the kf-camera dollies in, TypoBeat typography, glass
 * sweep, StageBackground glow and Grain — everything composited over
 * real 3D. Proof that the engine's language works unchanged on top of it.
 */

const Model: React.FC<{ scene: Group }> = ({ scene }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  // our SPRING preset lifts the laptop in
  const rise = f < 10 ? 0 : spring({ frame: f - 10, fps, config: SPRING.smooth, durationInFrames: 70 });
  // our kf camera-dolly (scale-equivalent) + slow orbit
  const dolly = kf(f, [
    [40, 0.82],
    [150, 1.08],
    [300, 1.14],
  ]);
  const orbit = -0.7 + f * 0.0042;
  const floatY = Math.sin(f * 0.04) * 0.03;

  return (
    <group scale={dolly}>
      <primitive
        object={scene}
        rotation={[0.24, orbit, 0]}
        position={[0, -0.78 + floatY + (1 - rise) * -2.6, 0]}
      />
    </group>
  );
};

export const Showcase3D: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const gltf = useGltf(staticFile("models/laptop.glb"));
  const scene = useMemo(() => {
    if (!gltf) return null;
    gltf.scene.traverse((o) => {
      if (o instanceof Mesh && o.material instanceof MeshStandardMaterial) {
        o.material.side = DoubleSide;
        o.material.metalness = Math.min(o.material.metalness, 0.55);
      }
    });
    return gltf.scene;
  }, [gltf]);

  // glass light sweep across the whole stage (our 2D layer over 3D)
  const sweepP = clamp01((f - 130) / 80);
  const sweepO = sweepP > 0 && sweepP < 1 ? 0.09 * Math.sin(Math.PI * sweepP) : 0;

  const sh = theme.shotik;

  return (
    <StageBackground bg={sh.bg} glowA={sh.accent} glowB={sh.accentDeep} glowOpacity={0.24}>
      <AbsoluteFill>
        <ThreeCanvas width={width} height={height} camera={{ fov: 34, position: [0, 1.7, 7.6] }}>
          <ambientLight intensity={0.6} />
          <pointLight position={[4, 5, 4]} intensity={260} color="#9FBEFF" />
          <pointLight position={[-5, 3.5, -2]} intensity={180} color={sh.accent} />
          <pointLight position={[0, -2, 3]} intensity={60} color="#3C4C7A" />
          {scene ? <Model scene={scene} /> : null}
        </ThreeCanvas>
      </AbsoluteFill>

      {/* our typography over the 3D */}
      <TypoBeat
        title="Real 3D. Same engine."
        sub="Blender assets · Remotion render"
        from={26}
        to={128}
        y={64}
        size={62}
        accentWord="3D"
        color={sh.text}
        subColor={sh.textMuted}
        accentColor={sh.accent}
      />
      <TypoBeat
        title="Every tool still works."
        sub="typography · springs · kf-camera · grain — on top of 3D"
        from={150}
        to={290}
        y={64}
        size={62}
        accentWord="Every tool"
        color={sh.text}
        subColor={sh.textMuted}
        accentColor={sh.accent}
      />

      {/* glass sweep */}
      {sweepO > 0 ? (
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: `${-50 + sweepP * 190}%`,
            width: "36%",
            height: "150%",
            rotate: "12deg",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)",
            opacity: sweepO,
            zIndex: 40,
          }}
        />
      ) : null}
    </StageBackground>
  );
};
