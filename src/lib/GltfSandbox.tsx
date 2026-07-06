import React, { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { DoubleSide, Mesh, MeshStandardMaterial } from "three";
import type { Group } from "three";
import { theme } from "../theme";
import { StageBackground } from "./StageBackground";
import { useGltf } from "./useGltf";

export const GLTF_SANDBOX_DURATION = 240;

/**
 * The full Blender → GLB → Remotion pipeline test: laptop.glb is modeled by
 * a headless Blender script (bevels + emissive screen — things three
 * primitives can't do cheaply), loaded here and staged on our dark set.
 */

const Model: React.FC<{ scene: Group }> = ({ scene }) => {
  const f = useCurrentFrame();
  // The GLB is baked already-open (transforms are Blender-side); here we
  // only stage it: slow orbit + gentle float.
  const orbit = -0.55 + f * 0.004;
  const floatY = Math.sin(f * 0.04) * 0.03;
  return (
    <primitive object={scene} rotation={[0.24, orbit, 0]} position={[0, -0.72 + floatY, 0]} />
  );
};

export const GltfSandbox: React.FC = () => {
  const { width, height } = useVideoConfig();
  // Load in the DOM root (delayRender is reliable here), pass into the canvas.
  const gltf = useGltf(staticFile("models/laptop.glb"));
  const scene = useMemo(() => {
    if (!gltf) return null;
    // Metals without an env map render near-black — clamp metalness;
    // make faces double-sided (GLTF culls backfaces).
    gltf.scene.traverse((o) => {
      if (o instanceof Mesh && o.material instanceof MeshStandardMaterial) {
        o.material.side = DoubleSide;
        o.material.metalness = Math.min(o.material.metalness, 0.55);
      }
    });
    return gltf.scene;
  }, [gltf]);
  return (
    <StageBackground
      bg={theme.shotik.bg}
      glowA={theme.shotik.accent}
      glowB={theme.shotik.accentDeep}
      glowOpacity={0.22}
    >
      <AbsoluteFill>
        <ThreeCanvas width={width} height={height} camera={{ fov: 34, position: [0, 1.7, 7.6] }}>
          <ambientLight intensity={0.6} />
          <pointLight position={[4, 5, 4]} intensity={260} color="#9FBEFF" />
          <pointLight position={[-5, 3.5, -2]} intensity={180} color={theme.shotik.accent} />
          <pointLight position={[0, -2, 3]} intensity={60} color="#3C4C7A" />
          {scene ? <Model scene={scene} /> : null}
        </ThreeCanvas>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 56,
          fontFamily: theme.font.family,
          fontSize: 24,
          fontWeight: 700,
          color: theme.shotik.textMuted,
          zIndex: 200,
        }}
      >
        Blender (headless) → laptop.glb → ThreeCanvas
      </div>
    </StageBackground>
  );
};
