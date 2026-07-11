import React, { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Color, DoubleSide, Mesh, MeshPhysicalMaterial, MeshStandardMaterial } from "three";
import type { Group } from "three";
import { theme } from "../theme";
import { StageBackground } from "../lib/StageBackground";
import { Environment3D } from "../lib/Environment3D";
import { PostFX } from "../lib/PostFX";
import { applyRimGlow } from "../lib/rimGlow";
import { useGltf } from "../lib/useGltf";

export const BYBIT_GIF_DURATION = 300; // 10s @ 30fps, seamless loop

/**
 * Telegram-post loop v2 (no copy — pure demonstration): the fully-designed
 * 3D Bybit card (face AND back) spins one full turn per clip; five REAL 3D
 * service tiles (extruded squircles with baked logo faces) orbit it inside
 * the same scene — occlusion, lighting and reflections come for free.
 * All rotation counts are integers → seamless loop.
 */

// exported for the L2 scene-graph test (BybitGif.test.tsx) — mounted headless
// through @react-three/test-renderer to assert footgun #7 (the <primitive>
// reparent) without a GPU. Export only; render output is unchanged (Δ=0).
export const Card3D: React.FC<{ scene: Group }> = ({ scene }) => {
  const f = useCurrentFrame();
  const spin = (f / BYBIT_GIF_DURATION) * Math.PI * 2 - 0.35;
  return (
    <group rotation={[0.08, spin, 0]} position={[0, 0.12, 0]} scale={0.75}>
      <primitive object={scene} rotation={[Math.PI / 2 + 0.06, 0, 0]} />
    </group>
  );
};

/**
 * Shared tile orbit — Tiles3D AND EnergyFlow both read this so the energy
 * pulses always track the moving tiles. Seamless: exactly 1 turn/loop; only
 * radius / tilt / phase vary by index (never speed). Layered radii 1.82..2.15
 * stay inside the safe window: > card sweep (~1.65) so tiles clear the edge-on
 * card, < visible half-width tan(fov/2)·camZ (~2.38) so they never leave frame.
 */
export const tileOrbit = (i: number, t: number) => {
  const TAU = Math.PI * 2;
  const seed = i * 1.7;
  const baseR = 1.82 + (i / 4) * 0.33;
  const a = (i / 5) * TAU + t * TAU;
  const incl = 0.32 + (i % 3) * 0.13;
  return {
    x: Math.cos(a) * baseR,
    y: -0.12 + Math.sin(a + seed) * incl,
    z: Math.sin(a) * baseR,
    sway: Math.sin(t * TAU + i * 1.9) * 0.6,
    scale: 0.46 + (i % 2) * 0.04,
  };
};

export const Tiles3D: React.FC<{ nodes: Group[] }> = ({ nodes }) => {
  const t = useCurrentFrame() / BYBIT_GIF_DURATION;
  return (
    <>
      {nodes.map((node, i) => {
        const o = tileOrbit(i, t);
        return (
          <group key={i} position={[o.x, o.y, o.z]} rotation={[0, o.sway, 0]} scale={o.scale}>
            <primitive object={node} />
          </group>
        );
      })}
    </>
  );
};

const CARD_CENTER: [number, number, number] = [0, 0.12, 0];

/**
 * Energy flow — the text-free money-shot. Warm glowing pulses stream from the
 * card centre out to each orbiting service tile, so the loop visually SAYS
 * "pay these services with this card" without a word. Pulses ride the shared
 * tileOrbit (always hit the moving tiles) and are emissive + toneMapped:false
 * so the PostFX bloom haloes them into real light. Seamless: the phase cycles
 * an integer number of times per loop; the sin() fade hides the wrap at the ends.
 */
const EnergyFlow: React.FC = () => {
  const t = useCurrentFrame() / BYBIT_GIF_DURATION;
  const PER_LINE = 4;
  const pulses: { pos: [number, number, number]; s: number; key: string }[] = [];
  for (let i = 0; i < 5; i++) {
    const o = tileOrbit(i, t);
    for (let j = 0; j < PER_LINE; j++) {
      const phase = (t * 2 + j / PER_LINE + i * 0.13) % 1; // card→tile, 2 cycles/loop
      const fade = Math.sin(phase * Math.PI); // bright mid-line, dark at both ends
      pulses.push({
        pos: [
          CARD_CENTER[0] + (o.x - CARD_CENTER[0]) * phase,
          CARD_CENTER[1] + (o.y - CARD_CENTER[1]) * phase,
          CARD_CENTER[2] + (o.z - CARD_CENTER[2]) * phase,
        ],
        s: 0.014 + 0.034 * fade,
        key: `${i}-${j}`,
      });
    }
  }
  return (
    <>
      {pulses.map((p) => (
        <mesh key={p.key} position={p.pos}>
          <sphereGeometry args={[p.s, 10, 10]} />
          <meshBasicMaterial color="#FFDE93" toneMapped={false} />
        </mesh>
      ))}
    </>
  );
};

/**
 * Faint warm bokeh drifting behind the card — breathes the stage the way
 * tixu's dot-particles do. Drift/twinkle use INTEGER harmonics of the loop
 * period (t = f/DURATION) so frame 0 and frame N match → the loop stays seamless.
 */
const Bokeh: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / BYBIT_GIF_DURATION;
  const TAU = Math.PI * 2;
  const dots = Array.from({ length: 16 }, (_, i) => {
    const seed = i * 12.9898;
    const bx = (Math.sin(seed) * 0.5 + 0.5) * 100;
    const by = (Math.cos(seed * 1.7) * 0.5 + 0.5) * 92 + 4;
    const x = bx + Math.sin(t * TAU + i * 1.3) * 2.2;
    const y = by + Math.cos(t * TAU + i * 0.9) * 1.8;
    const size = 3 + (i % 4) * 2.5;
    const op = 0.05 + (Math.sin(t * TAU * 2 + i) * 0.5 + 0.5) * 0.09;
    return { x, y, size, op, i };
  });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {dots.map((d) => (
        <div
          key={d.i}
          style={{
            position: "absolute",
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.size,
            height: d.size,
            borderRadius: "50%",
            background: "rgba(255,222,150,0.9)",
            filter: "blur(1.6px)",
            opacity: d.op,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/**
 * Camera rig — a gentle push-in + horizontal arc that resolves to a clean
 * frontal money-shot at the loop seam (t=0, the frame a viewer is most likely
 * to enter on). All motion is seamless (t=0 == t=1) and frame-driven, so it
 * stays deterministic and loop-safe.
 */
const CameraRig: React.FC = () => {
  const f = useCurrentFrame();
  const { camera } = useThree();
  const t = f / BYBIT_GIF_DURATION;
  const TAU = Math.PI * 2;
  camera.position.set(
    Math.sin(t * TAU) * 0.4, // subtle horizontal arc, 0 at the seam
    0.45 + Math.sin(t * TAU * 2) * 0.12, // tiny vertical bob (2/loop)
    7.8 - Math.sin(t * TAU) * 0.5, // push-in mid-loop, back at the seam
  );
  camera.lookAt(0, 0.1, 0);
  camera.updateProjectionMatrix();
  return null;
};

/**
 * Traveling key light — orbits the card on its OWN period (2 turns per loop,
 * deliberately NOT synced to the card spin) so a specular highlight physically
 * runs across the metal instead of sitting static. The Apple product-shot
 * trick: keep the object near-static, move the light. Integer turns → seamless.
 */
const KeyLight: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / BYBIT_GIF_DURATION;
  const a = t * Math.PI * 2 * 2; // 2 orbits per loop
  return (
    <pointLight
      position={[Math.cos(a) * 5.5, 4.2, 4 + Math.sin(a) * 2.4]}
      intensity={220}
      color="#FFE7B8"
    />
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
        const m = o.material;
        m.side = DoubleSide;
        // premium metal body: brushed-gold anisotropy + a clearcoat lacquer
        // layer — neither exists on MeshStandardMaterial, so swap in a
        // MeshPhysicalMaterial (copies the studio-env reflection intent, adds
        // the directional sheen + wet-lacquer highlight of a real metal card)
        if (m.name === "Body") {
          o.material = new MeshPhysicalMaterial({
            color: new Color(0.052, 0.054, 0.064),
            metalness: 0.9,
            roughness: 0.3,
            envMapIntensity: 1.5,
            clearcoat: 0.55,
            clearcoatRoughness: 0.2,
            anisotropy: 0.5,
            anisotropyRotation: Math.PI / 2,
            // native thin-film iridescence — subtle holo-foil shimmer that
            // shifts with view angle (deterministic: angle + env only, no time)
            iridescence: 0.45,
            iridescenceIOR: 1.35,
            iridescenceThicknessRange: [200, 520],
            side: DoubleSide,
          });
          applyRimGlow(o.material as MeshStandardMaterial, theme.bybit.accent, 4.0, 1.8);
        }
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
        const m = o.material;
        m.side = DoubleSide;
        // lift the tile bodies out of flat black: brighter base + glossy so they
        // hold volume and catch the rim/env instead of vanishing
        if (m.name === "TileBody") {
          m.color.setRGB(0.075, 0.078, 0.092);
          m.metalness = 0.6;
          m.roughness = 0.3;
          m.envMapIntensity = 1.6;
          applyRimGlow(m, theme.bybit.accent, 3.5, 2.2);
        }
        // logo faces pushed bright so the Bloom pass haloes them (they're the
        // visual hook — services as glowing satellites). Tuned per-render.
        if (m.name.startsWith("TileFace")) {
          m.emissiveIntensity = 1.55;
        }
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
    <StageBackground bg={by.bg} glowA={by.accent} glowB={by.accentDeep} glowOpacity={0.26} grain={0.06}>
      {/* warm ambient wash — lifts the dead black lower/side corners so the card
          sits in an atmosphere, not a void (children render over the vignette) */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(135% 105% at 50% 60%, rgba(247,166,0,0.17), rgba(247,166,0,0.045) 36%, transparent 62%)",
        }}
      />
      {/* faint top fill so the upper frame isn't a hard black cutoff */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(95% 72% at 50% 4%, rgba(150,138,110,0.10), transparent 56%)",
        }}
      />
      {/* concentrated halo directly behind the card */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "48%",
          translate: "-50% -50%",
          width: 980,
          height: 740,
          background: by.glow,
          filter: "blur(58px)",
          opacity: 0.9,
        }}
      />
      <Bokeh />
      <AbsoluteFill>
        <ThreeCanvas width={width} height={height} camera={{ fov: 34, position: [0, 0.45, 7.8] }}>
          <CameraRig />
          <Environment3D intensity={0.78} />
          <ambientLight intensity={0.42} />
          {/* warm key — TRAVELS on its own orbit → specular runs across the metal */}
          <KeyLight />
          {/* right fill — lifts the systematically shadowed right half of the card */}
          <pointLight position={[5.5, 0.6, 1.8]} intensity={75} color="#FFD98A" />
          {/* brand accent, lower-back-left */}
          <pointLight position={[-4, 2, -2]} intensity={110} color={by.accent} />
          {/* RIM / back-light — the key fix: haloes the top edges of card & tiles
              so the silhouette reads against the black instead of dissolving */}
          <pointLight position={[0, 3.6, -6]} intensity={300} color="#FFF3DA" />
          {card ? <Card3D scene={card} /> : null}
          {tileNodes ? <Tiles3D nodes={tileNodes} /> : null}
          <EnergyFlow />
          <PostFX
            bloomThreshold={0.68}
            bloomIntensity={0.5}
            focusRange={3.2}
            bokehScale={2.4}
            chromatic={0.0004}
          />
        </ThreeCanvas>
      </AbsoluteFill>
    </StageBackground>
  );
};
