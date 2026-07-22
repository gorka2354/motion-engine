import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { Scene3D } from "../../lib/Scene3D";
import { createRemoteModel } from "./createRemoteModel";

/**
 * Bench for the remote. Frame 0 is dead-on front (matches a reference product shot, and is what
 * check-fidelity compares against); the turntable turns it for eyes-on review. The camera sits
 * further back and wider than the other benches because the body is long and narrow.
 */
export const REMOTE_BENCH_DURATION = 120;
const BENCH_BG = "#f2f2f2";

const lights = (
  <>
    <ambientLight intensity={0.55} />
    <pointLight position={[2.5, 5, 6]} intensity={230} color="#ffffff" />
    <pointLight position={[-4, 1, 5]} intensity={120} color="#ffffff" />
    <pointLight position={[0, -2, -4]} intensity={70} color="#dfe6ff" />
  </>
);

export const RemoteBench: React.FC = () => {
  const model = useMemo(() => createRemoteModel(), []);
  const f = useCurrentFrame();
  const yaw = (f / REMOTE_BENCH_DURATION) * Math.PI * 2;
  return (
    <Scene3D
      background={BENCH_BG}
      lights={lights}
      environment={{ intensity: 0.5 }}
      camera={{ fov: 34, position: [0, 0, 11] }}
    >
      <primitive object={model.group} rotation={[0, yaw, 0]} />
    </Scene3D>
  );
};
