import React, { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { DoubleSide, Mesh, MeshStandardMaterial } from "three";
import type { Group } from "three";
import { theme } from "../theme";
import { StageBackground } from "../lib/StageBackground";
import { Environment3D } from "../lib/Environment3D";
import { useGltf } from "../lib/useGltf";

export const BYBIT_GIF_DURATION = 300; // 10s @ 30fps, seamless loop

/**
 * Telegram-post loop v2 (no copy — pure demonstration): the fully-designed
 * 3D Bybit card (face AND back) spins one full turn per clip; five REAL 3D
 * service tiles (extruded squircles with baked logo faces) orbit it inside
 * the same scene — occlusion, lighting and reflections come for free.
 * All rotation counts are integers → seamless loop.
 */

const Card3D: React.FC<{ scene: Group }> = ({ scene }) => {
  const f = useCurrentFrame();
  const spin = (f / BYBIT_GIF_DURATION) * Math.PI * 2 - 0.35;
  return (
    <group rotation={[0.08, spin, 0]} position={[0, 0.12, 0]} scale={0.75}>
      <primitive object={scene} rotation={[Math.PI / 2 + 0.06, 0, 0]} />
    </group>
  );
};

const Tiles3D: React.FC<{ nodes: Group[] }> = ({ nodes }) => {
  const f = useCurrentFrame();
  return (
    <>
      {nodes.map((node, i) => {
        const a = (i / 5) * Math.PI * 2 + (f / BYBIT_GIF_DURATION) * Math.PI * 2;
        // gentle sway (±35°, sine period = clip → loops): shows the 3D depth
        // without ever turning the featureless back to the camera
        const sway = Math.sin((f / BYBIT_GIF_DURATION) * Math.PI * 2 + i * 1.9) * 0.6;
        // orbit must FIT the 1:1 frame (|x|+tile half < tan(fov/2)·depth) AND
        // CLEAR the card: the spinning card sweeps a cylinder of radius
        // ~1.4 (half-width 1.28 + tilt), so min orbit radius must exceed
        // sweep + tile half-extent (~0.37) — an elliptic orbit with rz=1.05
        // sent tiles straight through the edge-on card
        return (
          <group
            key={i}
            position={[Math.cos(a) * 1.85, -0.15, Math.sin(a) * 1.85]}
            rotation={[0, sway, 0]}
            scale={0.48}
          >
            <primitive object={node} />
          </group>
        );
      })}
    </>
  );
};

export const BybitGif: React.FC = () => {
  const { width, height } = useVideoConfig();
  const cardGltf = useGltf(staticFile("models/bybit-card.glb"));
  const tilesGltf = useGltf(staticFile("models/bybit-tiles.glb"));

  const card = useMemo(() => {
    if (!cardGltf) return null;
    cardGltf.scene.traverse((o) => {
      if (o instanceof Mesh && o.material instanceof MeshStandardMaterial) {
        o.material.side = DoubleSide;
      }
    });
    return cardGltf.scene;
  }, [cardGltf]);

  // Resolve tile nodes ONCE, before <primitive> reparents them out of the
  // GLB scene — getObjectByName during render returns undefined from frame 2
  // on in sequential video renders (stills never catch this: fresh mount).
  const tileNodes = useMemo(() => {
    if (!tilesGltf) return null;
    tilesGltf.scene.traverse((o) => {
      if (o instanceof Mesh && o.material instanceof MeshStandardMaterial) {
        o.material.side = DoubleSide;
      }
    });
    const nodes: Group[] = [];
    for (let i = 0; i < 5; i++) {
      const n = tilesGltf.scene.getObjectByName(`Tile${i}`);
      if (n) {
        n.position.set(0, 0, 0);
        nodes.push(n as Group);
      }
    }
    return nodes;
  }, [tilesGltf]);

  const by = theme.bybit;

  return (
    <StageBackground bg={by.bg} glowA={by.accent} glowB={by.accentDeep} glowOpacity={0.16}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "52%",
          translate: "-50% -50%",
          width: 860,
          height: 660,
          background: by.glow,
          filter: "blur(52px)",
        }}
      />
      <AbsoluteFill>
        <ThreeCanvas width={width} height={height} camera={{ fov: 34, position: [0, 0.45, 7.8] }}>
          <Environment3D intensity={0.55} />
          <ambientLight intensity={0.3} />
          <pointLight position={[4, 4, 4]} intensity={200} color="#FFE3A6" />
          <pointLight position={[-4, 2, -2]} intensity={120} color={by.accent} />
          {card ? <Card3D scene={card} /> : null}
          {tileNodes ? <Tiles3D nodes={tileNodes} /> : null}
        </ThreeCanvas>
      </AbsoluteFill>
    </StageBackground>
  );
};
