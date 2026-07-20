import React, { useMemo } from "react";
import { staticFile, useCurrentFrame } from "remotion";
import type { Group, Object3D } from "three";
import { Scene3D } from "../../lib/Scene3D";
import { useGltf } from "../../lib/useGltf";
import { createLaptopModel } from "./createLaptopModel";

/**
 * A/B stand: the SAME laptop staged two ways — Blender→GLB (this file's
 * `LaptopGlbBench`) and the procedural factory (`LaptopFactoryBench`) — under an
 * identical rig, so a fidelity diff measures the MODEL and nothing else.
 *
 * Deliberate choices:
 * - Flat light backdrop, not the branded dark set: a silhouette mask can only be
 *   thresholded against a uniform background, and a dark laptop on a light field
 *   gives the cleanest edge.
 * - Neutral white lights, no brand accent: a coloured key would tint both models
 *   and muddy any palette comparison.
 * - Turntable driven purely by `frame`, so frame N is always the same yaw.
 */
export const LAPTOP_BENCH_DURATION = 120;

/** Fully-open lid angle, matching Laptop3DIntro's end state (open = 1). */
const LID_OPEN = -(0.1 + 1.68);
const BENCH_BG = "#c8ccd4";

const benchLights = (
  <>
    <ambientLight intensity={0.75} />
    <pointLight position={[4, 5, 4]} intensity={240} color="#ffffff" />
    <pointLight position={[-5, 3.5, -2]} intensity={160} color="#ffffff" />
  </>
);

/** Yaw at a given frame — one full turn over the bench duration. */
export const benchYaw = (frame: number): number =>
  (frame / LAPTOP_BENCH_DURATION) * Math.PI * 2;

const Turntable: React.FC<{ object: Object3D }> = ({ object }) => {
  const f = useCurrentFrame();
  return <primitive object={object} rotation={[0.18, benchYaw(f), 0]} position={[0, -0.7, 0]} />;
};

/**
 * Factory side of the A/B. Same rig, same turntable — only the model source
 * differs. Built once in a useMemo: the factory is synchronous, so there is no
 * delayRender/continueRender dance and no loading race to design around.
 */
export const LaptopFactoryBench: React.FC = () => {
  const model = useMemo(() => {
    const m = createLaptopModel();
    m.parts.lid.rotation.x = LID_OPEN; // same open angle as the GLB bench
    return m;
  }, []);
  return (
    <Scene3D background={BENCH_BG} lights={benchLights}>
      <Turntable object={model.group} />
    </Scene3D>
  );
};

export const LaptopGlbBench: React.FC = () => {
  const gltf = useGltf(staticFile("models/laptop-hinged.glb"));
  // Resolve the hinge ONCE — <primitive> reparents the node out of the GLB
  // scene, so a per-frame getObjectByName goes undefined from frame 2 in a
  // sequential render (footgun #7). The factory bench needs no such care.
  const scene = useMemo(() => {
    if (!gltf) return null;
    const lid = gltf.scene.getObjectByName("Lid");
    if (lid) lid.rotation.x = LID_OPEN;
    return gltf.scene as Group;
  }, [gltf]);
  return (
    <Scene3D background={BENCH_BG} lights={benchLights}>
      {scene ? <Turntable object={scene} /> : null}
    </Scene3D>
  );
};
