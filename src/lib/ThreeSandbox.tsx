import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { StageBackground } from "./StageBackground";
import { SPRING } from "../v2/anim";

export const THREE_SANDBOX_DURATION = 240;

/**
 * 3D test bench (@remotion/three): a primitive-built laptop that opens its
 * glowing lid and slowly orbits on the dark stage. Everything is driven by
 * useCurrentFrame — fully deterministic. Proof that real 3D composites with
 * our stage/grain look; real device models can come from Blender as GLB.
 */

const Laptop3D: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const open = f < 18 ? 0 : spring({ frame: f - 18, fps, config: SPRING.smooth, durationInFrames: 80 });
  const lidAngle = -0.06 - open * 1.78; // closed → ≈105° open
  const orbit = -0.55 + f * 0.004;
  const floatY = Math.sin(f * 0.04) * 0.03;

  return (
    <group rotation={[0.24, orbit, 0]} position={[0, -0.75 + floatY, 0]}>
      {/* deck */}
      <mesh>
        <boxGeometry args={[3.2, 0.1, 2.15]} />
        <meshStandardMaterial color="#232933" metalness={0.75} roughness={0.32} />
      </mesh>
      {/* keyboard well */}
      <mesh position={[0, 0.052, 0.1]}>
        <boxGeometry args={[2.9, 0.02, 1.6]} />
        <meshStandardMaterial color="#141920" metalness={0.4} roughness={0.65} />
      </mesh>
      {/* trackpad */}
      <mesh position={[0, 0.054, 0.92]}>
        <boxGeometry args={[1.0, 0.015, 0.55]} />
        <meshStandardMaterial color="#1B212A" metalness={0.5} roughness={0.45} />
      </mesh>
      {/* lid, hinged at the back edge */}
      <group position={[0, 0.06, -1.06]} rotation={[lidAngle, 0, 0]}>
        <mesh position={[0, 0.03, 1.07]}>
          <boxGeometry args={[3.2, 0.07, 2.15]} />
          <meshStandardMaterial color="#262C36" metalness={0.75} roughness={0.3} />
        </mesh>
        {/* screen — emissive brand glow on the inner face */}
        <mesh position={[0, -0.008, 1.07]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.95, 1.92]} />
          <meshStandardMaterial
            color="#0B0E20"
            emissive={theme.shotik.accent}
            emissiveIntensity={0.18 + open * 0.34}
          />
        </mesh>
        {/* screen spill light */}
        <pointLight position={[0, -0.4, 1.0]} intensity={open * 14} color={theme.shotik.accent} />
      </group>
    </group>
  );
};

export const ThreeSandbox: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <StageBackground
      bg={theme.shotik.bg}
      glowA={theme.shotik.accent}
      glowB={theme.shotik.accentDeep}
      glowOpacity={0.22}
    >
      <AbsoluteFill>
        <ThreeCanvas width={width} height={height} camera={{ fov: 34, position: [0, 1.7, 7.6] }}>
          <ambientLight intensity={0.6} />
          <pointLight position={[4, 5, 4]} intensity={260} color="#9FBEFF" />
          <pointLight position={[-5, 3.5, -2]} intensity={180} color={theme.shotik.accent} />
          <pointLight position={[0, -2, 3]} intensity={60} color="#3C4C7A" />
          <Laptop3D />
        </ThreeCanvas>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 56,
          fontFamily: theme.font.family,
          fontSize: 24,
          fontWeight: 700,
          color: theme.shotik.textMuted,
          zIndex: 200,
        }}
      >
        3D layer — @remotion/three (lid opens f18–98, slow orbit)
      </div>
    </StageBackground>
  );
};
