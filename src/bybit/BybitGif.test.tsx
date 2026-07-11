import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import ReactThreeTestRenderer from "@react-three/test-renderer";
import { Group, Mesh, BoxGeometry, MeshStandardMaterial } from "three";

/**
 * L2 (real-component tier) — the "next step over the caravan" flagged in the L2
 * backlog of docs/TESTING.md, built ON TOP of the generic R3F smoke in
 * src/lib/sceneGraph.test.tsx. That file characterizes the reconciler on
 * synthetic fixtures (mount, advanceFrames, reachability); THIS file mounts the
 * REAL BybitGif scene components headless and asserts footgun #7 on live code.
 *
 * Complements, doesn't duplicate:
 *  - sceneGraph.test.tsx proves a reparented node stays REACHABLE in the new scene.
 *  - here we prove the trap's other half on the real Tiles3D: after mount the node
 *    is GONE from its source GLB group → `getObjectByName` returns undefined, which
 *    is exactly why BybitGif resolves nodes ONCE in useMemo and never by-name again.
 *  - plus real Card3D/Tiles3D mount cleanly on our pins (three 0.171 / fiber 9 /
 *    React 19) in ms — today a broken 3D scene only shows up in a ~20s render.
 *
 * The components are Remotion-frame-driven (useCurrentFrame), NOT R3F useFrame — so
 * advanceFrames (sceneGraph.test.tsx's tool) doesn't move them. We mock that one hook
 * to a controllable frame and re-render via update() to exercise the orbit.
 */
const clock = vi.hoisted(() => ({ frame: 0 }));
vi.mock("remotion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("remotion")>()),
  useCurrentFrame: () => clock.frame,
}));

// imported AFTER the mock is registered (vi.mock is hoisted above imports)
import { Card3D, Tiles3D, tileOrbit, BYBIT_GIF_DURATION } from "./BybitGif";

/**
 * A stand-in for a loaded GLB tile: a named Group holding a Mesh, parented under
 * a "GLB scene" group — exactly the shape BybitGif pulls out of tilesGltf.scene
 * with getObjectByName(`Tile${i}`). No file I/O, no loader, no GPU.
 */
function fakeGlb(n = 5): { glb: Group; tiles: Group[] } {
  const glb = new Group();
  glb.name = "TilesScene";
  const tiles = Array.from({ length: n }, (_, i) => {
    const node = new Group();
    node.name = `Tile${i}`;
    const body = new Mesh(new BoxGeometry(0.6, 0.6, 0.1), new MeshStandardMaterial());
    body.name = `TileBody${i}`;
    node.add(body);
    glb.add(node);
    return node;
  });
  return { glb, tiles };
}

beforeEach(() => {
  clock.frame = 0;
});

describe("Bybit 3D scene — footgun #7 on the live component (L2, no GPU)", () => {
  it("Tiles3D mounts every pre-resolved node; getObjectByName is dead after (footgun #7)", async () => {
    const { glb, tiles } = fakeGlb(5);
    const r = await ReactThreeTestRenderer.create(<Tiles3D nodes={tiles} />);

    for (const node of tiles) {
      // the exact trap: after mount the GLB no longer owns the node, so resolving
      // it by name on a later frame would yield undefined — BybitGif dodges this
      // by resolving ONCE in useMemo and holding the references (`tiles`).
      expect(glb.getObjectByName(node.name)).toBeUndefined();
      expect(node.parent).not.toBe(glb); // moved under an R3F wrapper group…
      expect(node.parent).not.toBeNull(); // …and nothing was lost
    }
    // all 5 tile bodies made it into the tree
    expect(r.scene.findAllByType("Mesh").length).toBe(5);
    await r.unmount();
  });

  it("orbit transform is wired to the Remotion frame and matches tileOrbit()", async () => {
    const { tiles } = fakeGlb(5);
    clock.frame = 0;
    const r = await ReactThreeTestRenderer.create(<Tiles3D nodes={tiles} />);

    const wrap0 = tiles[0].parent!; // the <group> Tiles3D wraps each node in
    const o0 = tileOrbit(0, 0);
    expect(wrap0.position.x).toBeCloseTo(o0.x, 5); // data → mounted transform
    expect(wrap0.position.z).toBeCloseTo(o0.z, 5);
    const p0 = wrap0.position.clone();

    clock.frame = Math.round(BYBIT_GIF_DURATION / 2); // half the loop
    await r.update(<Tiles3D nodes={tiles} />);

    const p1 = tiles[0].parent!.position;
    expect(p0.distanceTo(p1)).toBeGreaterThan(0.5); // the tile physically orbited
    await r.unmount();
  });

  it("Card3D mounts a GLB scene through <primitive> on our pins", async () => {
    const scene = new Group();
    scene.name = "CardScene";
    scene.add(new Mesh(new BoxGeometry(1, 1, 0.1), new MeshStandardMaterial()));

    const r = await ReactThreeTestRenderer.create(<Card3D scene={scene} />);
    expect(scene.parent).not.toBeNull(); // mounted into the rig group
    expect(r.scene.findAllByType("Mesh").length).toBe(1);
    await r.unmount();
  });
});
