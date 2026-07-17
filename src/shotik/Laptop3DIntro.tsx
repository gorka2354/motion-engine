import React, { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { DoubleSide, Mesh, MeshStandardMaterial } from "three";
import type { Group } from "three";
import { theme } from "../theme";
import { useGltf } from "../lib/useGltf";
import { Environment3D } from "../lib/Environment3D";
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

  // showcase spin: the CLOSED laptop rotates in on display, then turns to
  // face the camera (~f0-46) — a livelier open than a static reveal
  const orbit = kf(f, [
    [0, -3.6],
    [30, 0.18],
    [46, 0],
  ]);
  // lid opens only AFTER the laptop has turned to face us
  const open = f < 30 ? 0 : spring({ frame: f - 30, fps, config: SPRING.smooth, durationInFrames: 58 });
  // during the dolly the lid straightens a touch toward the camera plane,
  // so the baked desktop lands square-on for the match-cut
  const straighten = kf(f, [
    [62, 0],
    [102, 0.14],
  ]);
  const lid = scene.getObjectByName("Lid");
  if (lid) lid.rotation.x = -(0.1 + 1.68 * open) + straighten;
  // Screen powers on only once the lid is open, to EXACTLY the 2D desktop
  // brightness (the texture IS the 2D still).
  if (screenMat) {
    screenMat.emissiveIntensity = kf(f, [
      [0, 0.02],
      [72, 0.08],
      [98, 1.0],
    ]);
  }

  // dolly LOCKS at f102 — the image is frozen through most of the fade,
  // so the cross-dissolve happens between two static, aligned pictures
  const dolly = kf(f, [
    [66, 1.0],
    [102, 3.26],
  ]);
  const py = kf(f, [
    [66, -0.78],
    [102, -1.52],
  ]);
  // a touch more top-down tilt while it spins, settling flat for the dive-in
  const tilt = kf(f, [
    [0, 0.42],
    [30, 0.26],
    [98, 0],
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
        if (o.name === "ScreenFace") screenMat = o.material;
      }
    });
    return { scene: gltf.scene, screenMat };
  }, [gltf]);

  if (f > INTRO_END || !prepared) return null;
  // short fade — the baked-texture match-cut does most of the work
  const o = 1 - clamp01((f - 100) / 10);

  return (
    <AbsoluteFill style={{ opacity: o }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 34, position: [0, 1.7, 7.6] }}>
        <Environment3D intensity={0.5} />
        <ambientLight intensity={0.25} />
        <pointLight position={[4, 5, 4]} intensity={180} color="#9FBEFF" />
        <pointLight position={[-5, 3.5, -2]} intensity={150} color={theme.shotik.accent} />
        <Rig3D scene={prepared.scene} screenMat={prepared.screenMat} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
