import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ClockFix } from "./ClockFix";
import { Environment3D } from "./Environment3D";
import { PostFX } from "./PostFX";

/**
 * Reusable <ThreeCanvas> rig: camera + env lighting + frame-locked clock, with
 * slots for per-scene lights and post.
 *
 * WHY: the same canvas/camera/three-point-light block is hand-copied in
 * GltfSandbox, Showcase3D, ThreeSandbox, Laptop3DIntro and BybitGif — five
 * near-identical rigs. New scenes (the model benches) build on this instead.
 * Existing scenes are deliberately NOT migrated: each carries its own light rig
 * and would need a Δ=0 proof per scene for zero user-visible gain.
 *
 * `lights` stays a slot rather than a default: brand rigs differ too much
 * (Bybit moves a key light per frame, Shotik is a static 3-point) and baking one
 * in would just be a wrong default everyone overrides.
 *
 * <ClockFix> is on by default — it's cheap and only ever removes a source of
 * non-determinism (see its own doc comment).
 */
export interface Scene3DProps {
  /** Defaults to the composition's dimensions. */
  width?: number;
  height?: number;
  camera?: { fov?: number; position?: [number, number, number] };
  /** RoomEnvironment PMREM. `false` disables it (flat/unlit looks). */
  environment?: { intensity?: number } | false;
  /** Per-scene light rig — dropped inside the canvas before the models. */
  lights?: React.ReactNode;
  /** Cinematic post stack; off by default (only BybitGif uses it today). */
  postFX?: React.ComponentProps<typeof PostFX> | false;
  /**
   * Flat CSS backdrop behind the canvas. Needed by the fidelity check: a
   * silhouette mask can only be thresholded against a uniform background.
   */
  background?: string;
  clockFix?: boolean;
  children?: React.ReactNode;
}

const DEFAULT_CAMERA = { fov: 34, position: [0, 1.7, 7.6] as [number, number, number] };

export const Scene3D: React.FC<Scene3DProps> = ({
  width,
  height,
  camera,
  environment = { intensity: 0.65 },
  lights,
  postFX = false,
  background,
  clockFix = true,
  children,
}) => {
  const config = useVideoConfig();
  const canvas = (
    <ThreeCanvas
      width={width ?? config.width}
      height={height ?? config.height}
      camera={{ ...DEFAULT_CAMERA, ...camera }}
    >
      {clockFix ? <ClockFix /> : null}
      {environment === false ? null : <Environment3D intensity={environment.intensity} />}
      {lights}
      {children}
      {/* after the meshes — EffectComposer must run last */}
      {postFX === false ? null : <PostFX {...postFX} />}
    </ThreeCanvas>
  );
  if (!background) return canvas;
  return <AbsoluteFill style={{ background }}>{canvas}</AbsoluteFill>;
};
