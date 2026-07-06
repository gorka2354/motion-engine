import React, { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { DoubleSide, Mesh, MeshStandardMaterial } from "three";
import type { Group } from "three";
import { theme } from "../theme";
import { useGltf } from "../lib/useGltf";
import { clamp01, kf, SPRING } from "../v2/anim";

/**
 * Opening shot: the hinged Blender laptop (laptop-hinged.glb) opens its lid
 * on a SPRING, the emissive screen glows up, the camera dollies INTO the
 * display and the shot cross-fades into the 2D desktop flow (~f110).
 */

const INTRO_END = 112;

const Rig3D: React.FC<{ scene: Group; screenMat: MeshStandardMaterial | null }> = ({
  scene,
  screenMat,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  const open = f < 8 ? 0 : spring({ frame: f - 8, fps, config: SPRING.smooth, durationInFrames: 76 });
  const lid = scene.getObjectByName("Lid");
  if (lid) lid.rotation.x = -(0.1 + 1.68 * open);
  // The display stays dark while the hook headline crosses it, then powers
  // on right before the dolly — «the laptop wakes up and we dive in».
  if (screenMat) {
    screenMat.emissiveIntensity = kf(f, [
      [0, 0.1],
      [64, 0.16],
      [96, 1.45],
    ]);
  }

  const dolly = kf(f, [
    [58, 1.0],
    [106, 3.3],
  ]);
  const py = kf(f, [
    [58, -0.78],
    [106, -1.55],
  ]);
  const tilt = kf(f, [
    [0, 0.24],
    [100, 0.04],
  ]);
  const orbit = kf(f, [
    [0, -0.6],
    [100, 0],
  ]);

  return (
    <group scale={dolly}>
      <primitive object={scene} rotation={[tilt, orbit, 0]} position={[0, py, 0]} />
    </group>
  );
};

export const Laptop3DIntro: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const gltf = useGltf(staticFile("models/laptop-hinged.glb"));

  const prepared = useMemo(() => {
    if (!gltf) return null;
    let screenMat: MeshStandardMaterial | null = null;
    gltf.scene.traverse((o) => {
      if (o instanceof Mesh && o.material instanceof MeshStandardMaterial) {
        o.material.side = DoubleSide;
        o.material.metalness = Math.min(o.material.metalness, 0.55);
        if (o.name === "ScreenFace") screenMat = o.material;
      }
    });
    return { scene: gltf.scene, screenMat };
  }, [gltf]);

  if (f > INTRO_END || !prepared) return null;
  const o = 1 - clamp01((f - 94) / 16);

  return (
    <AbsoluteFill style={{ opacity: o }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 34, position: [0, 1.7, 7.6] }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[4, 5, 4]} intensity={260} color="#9FBEFF" />
        <pointLight position={[-5, 3.5, -2]} intensity={180} color={theme.shotik.accent} />
        <pointLight position={[0, -2, 3]} intensity={60} color="#3C4C7A" />
        <Rig3D scene={prepared.scene} screenMat={prepared.screenMat} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
