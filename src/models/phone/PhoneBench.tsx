import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { Scene3D } from "../../lib/Scene3D";
import { createPhoneModel } from "./createPhoneModel";

/**
 * Turntable bench for the phone. Frame 0 is dead-on front so check-fidelity compares like with
 * like; a full revolution spans the duration, so 1/4 of it is the side view the flatness and
 * depth checks read.
 *
 * Tilted slightly so the camera island catches light — a phone shot perfectly flat-on hides
 * every surface that isn't the screen.
 */
export const PHONE_BENCH_DURATION = 120;
const BENCH_BG = "#eceef2";

const lights = (
  <>
    <ambientLight intensity={0.5} />
    {/* glass and anodised aluminium both live or die on the key highlight */}
    <pointLight position={[3, 4.5, 6]} intensity={210} color="#ffffff" />
    <pointLight position={[-4, 1.5, 4]} intensity={110} color="#ffffff" />
    <pointLight position={[0, -2, -4]} intensity={80} color="#cfd8ff" />
  </>
);

export const PhoneBench: React.FC = () => {
  const model = useMemo(() => createPhoneModel(), []);
  const f = useCurrentFrame();
  const yaw = (f / PHONE_BENCH_DURATION) * Math.PI * 2;
  return (
    <Scene3D
      background={BENCH_BG}
      lights={lights}
      environment={{ intensity: 0.45 }}
      camera={{ fov: 28, position: [0, 0, 13] }}
    >
      <primitive object={model.group} rotation={[0.12, yaw, 0]} />
    </Scene3D>
  );
};
