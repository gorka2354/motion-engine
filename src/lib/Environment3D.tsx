import React, { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { PMREMGenerator } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * Studio environment lighting for ThreeCanvas scenes: three's built-in
 * RoomEnvironment baked through PMREM — metals and glossy materials get
 * real reflections (without it they render flat/black). No external
 * assets, fully deterministic. Drop inside <ThreeCanvas>.
 */
export const Environment3D: React.FC<{ intensity?: number }> = ({ intensity = 0.65 }) => {
  const { gl, scene } = useThree();
  const envMap = useMemo(() => {
    const pmrem = new PMREMGenerator(gl);
    return pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  }, [gl]);
  scene.environment = envMap;
  scene.environmentIntensity = intensity;
  return null;
};
