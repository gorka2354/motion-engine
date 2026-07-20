import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { Scene3D } from "../../lib/Scene3D";
import { createGamepadModel } from "./createGamepadModel";

/**
 * Bench for the photo-sourced controller. Frame 0 is dead-on front, matching the reference
 * shot, so check-fidelity compares like with like; later frames turn it for eyes-on review.
 *
 * The backdrop is near-white to match the product photo — the silhouette check thresholds the
 * subject against it, and a dark model on a light field gives the cleanest edge.
 */
export const GAMEPAD_BENCH_DURATION = 120;
const BENCH_BG = "#f2f2f2";

const lights = (
  <>
    <ambientLight intensity={0.55} />
    {/* key from upper-front: matte plastic only shows its form through a broad soft specular */}
    <pointLight position={[2.5, 4, 6]} intensity={190} color="#ffffff" />
    <pointLight position={[-4, 2, 5]} intensity={110} color="#ffffff" />
    {/* rim from behind separates a black body from a light backdrop */}
    <pointLight position={[0, -1.5, -4]} intensity={70} color="#dfe6ff" />
  </>
);

export const GamepadBench: React.FC = () => {
  const model = useMemo(() => createGamepadModel(), []);
  const f = useCurrentFrame();
  // Full turntable: frame 0 is dead-on front (so check-fidelity compares against the reference
  // shot), and the loop closes seamlessly because a whole revolution lands back at 0.
  const yaw = (f / GAMEPAD_BENCH_DURATION) * Math.PI * 2;
  return (
    <Scene3D
      background={BENCH_BG}
      lights={lights}
      environment={{ intensity: 0.5 }}
      camera={{ fov: 30, position: [0, 0, 9] }}
    >
      <primitive object={model.group} rotation={[0, yaw, 0]} />
    </Scene3D>
  );
};
