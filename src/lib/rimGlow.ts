import { Color } from "three";
import type { MeshStandardMaterial } from "three";

/**
 * Fresnel rim-glow injected into an existing PBR material — a soft emissive
 * halo along the silhouette, bright at grazing angles. Adds to
 * `totalEmissiveRadiance`, so it lands in the real scene buffer and a Bloom pass
 * haloes it HONESTLY (unlike a postprocessing outline, which draws over the
 * merged buffer and gets no bloom). Purely geometric (normal·view) →
 * deterministic, reads no clock. Works on `MeshStandardMaterial` and subclasses
 * (`MeshPhysicalMaterial`).
 *
 * - `power`  — falloff exponent. Higher = tighter, crisper edge line (≈ a
 *   contour); lower = a broad, soft energy field. ~2.5 soft … ~4-5 crisp.
 * - `intensity` — brightness. Push above the Bloom `luminanceThreshold` for a
 *   glowing edge; keep low for a matte rim.
 *
 * If you need to animate it, mutate `mat.userData.rimShader.uniforms.*.value`
 * from `useCurrentFrame()` in the component body — never from a clock/useFrame.
 */
export const applyRimGlow = (
  mat: MeshStandardMaterial,
  color: string,
  power = 2.6,
  intensity = 1.3,
) => {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRimColor = { value: new Color(color) };
    shader.uniforms.uRimPower = { value: power };
    shader.uniforms.uRimIntensity = { value: intensity };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vRimNormal;\nvarying vec3 vRimViewDir;",
      )
      .replace(
        "#include <project_vertex>",
        "#include <project_vertex>\nvRimNormal = normalize(normalMatrix * normal);\nvRimViewDir = normalize(-mvPosition.xyz);",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vRimNormal;\nvarying vec3 vRimViewDir;\nuniform vec3 uRimColor;\nuniform float uRimPower;\nuniform float uRimIntensity;",
      )
      .replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\nfloat rimFresnel = pow(1.0 - saturate(dot(normalize(vRimNormal), normalize(vRimViewDir))), uRimPower);\ntotalEmissiveRadiance += uRimColor * rimFresnel * uRimIntensity;",
      );
    mat.userData.rimShader = shader;
  };
  mat.customProgramCacheKey = () => `rim-${color}-${power}-${intensity}`;
};
