import React, { useMemo } from "react";
import { ContactShadows } from "@react-three/drei";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";

/**
 * Studio-lighting presets that plug into `Scene3D`'s existing `lights` and `children` slots.
 *
 * WHY PRESETS AND NOT A NEW SCENE COMPONENT: `Scene3D` deliberately keeps `lights` as a slot —
 * "brand rigs differ too much, and baking one in would just be a wrong default everyone
 * overrides". That reasoning still holds, so this adds options rather than a second way to build
 * a scene.
 *
 * WHY THE FLAT LOOK EXISTS TODAY: every light in the repo is a point light. A point light has no
 * size, so glossy and metal surfaces get a small hard dot instead of the broad soft gradient a
 * real softbox produces — and nothing casts a shadow anywhere (`grep castShadow src` → 0), so
 * objects float rather than sit.
 *
 * ⚠️ NOT for the `*Bench` comps that `check-fidelity` measures. `silhouetteMask` samples the four
 * corner pixels as its single background reference; a gradient backdrop or a shadow smudge on the
 * floor reads as SUBJECT, inflating the bbox and corrupting the silhouette, flatness and
 * depth-ratio numbers. Benches keep the flat backdrop and no floor. Use this on hero shots.
 */

/**
 * `RectAreaLight` needs its LTC lookup tables initialised once per process, or it silently does
 * nothing. `useMemo` with an empty dependency list keeps it to one call per component instance;
 * the underlying init is idempotent.
 */
const useAreaLights = (): void => {
  useMemo(() => {
    RectAreaLightUniformsLib.init();
  }, []);
};

export interface SoftboxRigProps {
  /** Overall brightness multiplier — the individual lights keep their relative balance. */
  intensity?: number;
  /** Distance of the boxes from the subject; scale with the object's size. */
  distance?: number;
  keyColor?: string;
  fillColor?: string;
  rimColor?: string;
}

/**
 * Three-point rig built from AREA lights rather than points: a large key box, a weaker fill on the
 * opposite side, and a cool rim behind to separate the subject from the backdrop.
 *
 * RectAreaLight only affects Standard/Physical materials (our models are), and it casts no
 * shadows at all — that is what `<ContactShadowFloor>` is for.
 */
export const SoftboxRig: React.FC<SoftboxRigProps> = ({
  intensity = 1,
  distance = 6,
  keyColor = "#ffffff",
  fillColor = "#ffffff",
  rimColor = "#cfd8ff",
}) => {
  useAreaLights();
  return (
    <>
      {/* ambient stays low — area lights do the work, ambient only lifts the darkest crevices */}
      <ambientLight intensity={0.18 * intensity} />
      <rectAreaLight
        position={[distance * 0.55, distance * 0.62, distance * 0.85]}
        rotation={[-0.5, 0.6, 0]}
        width={distance * 1.1}
        height={distance * 1.1}
        intensity={7 * intensity}
        color={keyColor}
      />
      <rectAreaLight
        position={[-distance * 0.75, distance * 0.15, distance * 0.6]}
        rotation={[-0.15, -0.9, 0]}
        width={distance * 0.9}
        height={distance * 0.9}
        intensity={2.6 * intensity}
        color={fillColor}
      />
      <rectAreaLight
        position={[0, distance * 0.25, -distance * 0.9]}
        rotation={[0.1, Math.PI, 0]}
        width={distance}
        height={distance * 0.7}
        intensity={3.4 * intensity}
        color={rimColor}
      />
    </>
  );
};

export interface ContactShadowFloorProps {
  /** Y of the floor plane — put it at the object's lowest point. */
  y?: number;
  opacity?: number;
  blur?: number;
  scale?: number;
  /**
   * How many frames to recompute the shadow for. `1` is right for a subject that only rotates in
   * place: the shadow is baked once and costs nothing afterwards. `Infinity` re-renders an extra
   * depth pass EVERY frame — on this project's software rasteriser (swangle, no GPU) that is a
   * real per-frame cost, so it is opt-in rather than the default drei behaviour.
   */
  frames?: number;
}

/** Grounds the subject. Not shadow mapping — drei renders depth to a texture and blurs it. */
export const ContactShadowFloor: React.FC<ContactShadowFloorProps> = ({
  y = -1,
  opacity = 0.55,
  blur = 2.4,
  scale = 12,
  frames = 1,
}) => (
  <ContactShadows
    position={[0, y, 0]}
    opacity={opacity}
    blur={blur}
    scale={scale}
    far={Math.abs(y) + 4}
    resolution={1024}
    frames={frames}
    color="#0a0d14"
  />
);
