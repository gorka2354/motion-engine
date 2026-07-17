import React, { useMemo } from "react";
import { Color, Vector2, Vector3 } from "three";
import type { Object3D } from "three";
import {
  EffectComposer,
  Bloom,
  DepthOfField,
  Vignette,
  ChromaticAberration,
  ToneMapping,
  Outline,
  SMAA,
} from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";

/**
 * Reusable cinematic post stack for engine 3D scenes. Every effect here is
 * SPATIAL (threshold/blur/depth/radial) and reads no clock/delta → deterministic
 * under @remotion/three (unlike Noise / adaptive ToneMapping — see footgun #11,
 * deliberately excluded). Drop as a sibling inside <ThreeCanvas>, after the
 * lights and meshes.
 *
 * - Bloom: haloes emissive logos + metal speculars (luminanceThreshold gates it
 *   to bright pixels so the dark card body doesn't wash out).
 * - DepthOfField: focus on a WORLD point (focusTarget, default scene origin), not
 *   a fiddly normalized focusDistance. focusRange keeps the hero object sharp;
 *   only the far background / drifting particles go soft → real lens boke.
 * - ChromaticAberration + Vignette + ACES ToneMapping: the cinematic finish.
 *
 * ⚠️ multisampling MUST be > 0: EffectComposer renders the scene into its own
 * framebuffer, bypassing the canvas-level antialias, so multisampling=0 leaves
 * geometry edges jagged (and bloom/DoF then smear those stair-steps into "mush").
 * MSAA inside the composer is the fix. Cost: ~4 fullscreen passes/frame.
 */
export const PostFX: React.FC<{
  bloomThreshold?: number;
  bloomIntensity?: number;
  bloomSmoothing?: number;
  focusTarget?: [number, number, number];
  focusRange?: number;
  bokehScale?: number;
  vignette?: number;
  chromatic?: number;
  multisampling?: number;
  /** Object3D[] to draw a crisp selection outline around (e.g. GLB card + tiles). */
  outlineSelection?: Object3D[];
  outlineColor?: string;
  outlineStrength?: number;
}> = ({
  bloomThreshold = 0.6,
  bloomIntensity = 0.6,
  bloomSmoothing = 0.2,
  focusTarget = [0, 0, 0],
  focusRange = 3.5,
  bokehScale = 2,
  vignette = 0.82,
  chromatic = 0.0008,
  multisampling = 8,
  outlineSelection,
  outlineColor = "#F7A600",
  outlineStrength = 3,
}) => {
  const caOffset = useMemo(() => new Vector2(chromatic, chromatic), [chromatic]);
  const edgeHex = useMemo(() => new Color(outlineColor).getHex(), [outlineColor]);
  const target = useMemo(
    () => new Vector3(focusTarget[0], focusTarget[1], focusTarget[2]),
    [focusTarget],
  );
  const effects = [
    <DepthOfField key="dof" target={target} focusRange={focusRange} bokehScale={bokehScale} />,
    <Bloom
      key="bloom"
      mipmapBlur
      luminanceThreshold={bloomThreshold}
      luminanceSmoothing={bloomSmoothing}
      intensity={bloomIntensity}
    />,
    <ToneMapping key="tone" mode={ToneMappingMode.ACES_FILMIC} />,
    ...(outlineSelection && outlineSelection.length > 0
      ? [
          <Outline
            key="outline"
            selection={outlineSelection}
            blendFunction={BlendFunction.SCREEN}
            edgeStrength={outlineStrength}
            visibleEdgeColor={edgeHex}
            hiddenEdgeColor={edgeHex}
            pulseSpeed={0}
            blur
          />,
        ]
      : []),
    <ChromaticAberration key="ca" offset={caOffset} radialModulation={false} modulationOffset={0} />,
    <Vignette key="vignette" eskil={false} offset={0.18} darkness={vignette} />,
    // SMAA LAST — morphological AA over the FINISHED frame. multisampling (MSAA)
    // only anti-aliases the primary geometry pass; DoF/Bloom/CA then re-sample in
    // screen-space and reintroduce edge jaggies. A final SMAA pass is what
    // actually gives clean edges under postprocessing (see footgun #12).
    <SMAA key="smaa" />,
  ];
  return <EffectComposer multisampling={multisampling}>{effects}</EffectComposer>;
};
