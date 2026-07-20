import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { NeutralToneMapping } from "three";
import { Scene3D } from "../../lib/Scene3D";
import { ContactShadowFloor, SoftboxRig } from "../../lib/studio";
import { createPhoneModel } from "./createPhoneModel";

/**
 * The same phone as `PhoneBench`, lit as a product shot instead of a measurement rig.
 *
 * This exists as a SEPARATE composition on purpose. `PhoneBench` must keep its flat backdrop and
 * bare point lights because `check-fidelity` thresholds the silhouette against the four corner
 * pixels — a gradient backdrop and a contact shadow would both read as subject and corrupt every
 * shape number it produces. Measurement rig and beauty rig have different jobs.
 *
 * Three differences from the bench, and each addresses a named cause of the "object in a vacuum"
 * look:
 *   - AREA lights instead of point lights: a point light has no size, so it can only make a small
 *     hard dot on a glossy surface. A softbox makes the broad gradient that reads as product photo.
 *   - a contact shadow: nothing in this repo cast a shadow anywhere, so objects floated.
 *   - Neutral tone mapping instead of R3F's default ACES Filmic, which desaturates saturated tones.
 *     Scoped to this composition — changing it globally would alter the pixels of every shipped
 *     video, including ShotikPromo and BybitCardGif.
 */
export const PHONE_HERO_DURATION = 120;

/** Graduated backdrop: a flat fill is what makes a render look like a swatch rather than a set. */
const HERO_BG = "radial-gradient(120% 100% at 50% 22%, #f7f8fa 0%, #dfe3ea 55%, #c3c9d4 100%)";

export const PhoneHero: React.FC = () => {
  const model = useMemo(() => createPhoneModel(), []);
  const f = useCurrentFrame();
  const yaw = (f / PHONE_HERO_DURATION) * Math.PI * 2;
  return (
    <Scene3D
      background={HERO_BG}
      lights={<SoftboxRig distance={7} intensity={1.05} />}
      environment={{ intensity: 0.32 }}
      camera={{ fov: 26, position: [0, 0.35, 14] }}
      gl={{ toneMapping: NeutralToneMapping, toneMappingExposure: 1.15 }}
    >
      <primitive object={model.group} rotation={[0.1, yaw, 0]} />
      <ContactShadowFloor y={-2.35} opacity={0.5} blur={2.6} scale={11} frames={1} />
    </Scene3D>
  );
};
