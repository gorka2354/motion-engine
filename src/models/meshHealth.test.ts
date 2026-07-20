import { describe, expect, it } from "vitest";
import { BoxGeometry, BufferGeometry, Float32BufferAttribute, Mesh, SphereGeometry } from "three";
import { checkClosedShell, inspectMesh } from "./meshHealth";
import { createGamepadModel } from "./gamepad/createGamepadModel";
import { createPhoneModel } from "./phone/createPhoneModel";
import { createLaptopModel } from "./laptop/createLaptopModel";

/**
 * Every detector here is proved on a DELIBERATELY BROKEN mesh, not just on a healthy one. A
 * topology checker that only ever sees good input is indistinguishable from `return []`.
 *
 * The four defects below are the ones that actually cost time in this repo, or would have:
 * inside-out shell (shipped once, caught by eye), a locally flipped patch, a hole, and
 * degenerate triangles.
 */

/** Flip every triangle's winding — the whole shell turns inside-out. */
const invert = (geo: BufferGeometry): BufferGeometry => {
  const g = geo.clone().toNonIndexed();
  const pos = g.getAttribute("position");
  const arr = Array.from(pos.array as Float32Array);
  const out: number[] = [];
  for (let t = 0; t < arr.length; t += 9) {
    // swap vertices 1 and 2 of each triangle
    out.push(...arr.slice(t, t + 3), ...arr.slice(t + 6, t + 9), ...arr.slice(t + 3, t + 6));
  }
  const flipped = new BufferGeometry();
  flipped.setAttribute("position", new Float32BufferAttribute(out, 3));
  return flipped;
};

/** Flip a single triangle, leaving the rest of the shell correct. */
const flipOneTriangle = (geo: BufferGeometry): BufferGeometry => {
  const g = geo.clone().toNonIndexed();
  const arr = Array.from(g.getAttribute("position").array as Float32Array);
  const t = 0;
  const swapped = [
    ...arr.slice(0, t + 3),
    ...arr.slice(t + 6, t + 9),
    ...arr.slice(t + 3, t + 6),
    ...arr.slice(t + 9),
  ];
  const out = new BufferGeometry();
  out.setAttribute("position", new Float32BufferAttribute(swapped, 3));
  return out;
};

/** Remove one triangle — punches a hole in an otherwise closed shell. */
const punchHole = (geo: BufferGeometry): BufferGeometry => {
  const g = geo.clone().toNonIndexed();
  const arr = Array.from(g.getAttribute("position").array as Float32Array);
  const out = new BufferGeometry();
  out.setAttribute("position", new Float32BufferAttribute(arr.slice(9), 3));
  return out;
};

describe("inspectMesh — healthy geometry", () => {
  it("a box is closed, consistently wound and outward-facing", () => {
    const r = inspectMesh(new BoxGeometry(1, 1, 1));
    expect(r.boundaryEdges).toBe(0);
    expect(r.nonManifoldEdges).toBe(0);
    expect(r.inconsistentEdges).toBe(0);
    expect(r.signedVolume).toBeCloseTo(1, 2); // a unit cube encloses 1
    expect(checkClosedShell(new BoxGeometry(1, 1, 1))).toEqual([]);
  });

  it("welds procedural seams before judging — unwelded input would look full of holes", () => {
    // A sphere ships with a duplicated seam column; without welding those read as boundary edges.
    const geo = new SphereGeometry(1, 16, 12);
    const r = inspectMesh(geo);
    expect(r.welded).toBeGreaterThan(0);
    expect(r.boundaryEdges).toBe(0);
  });
});

describe("inspectMesh — DETECTS the defects it exists for", () => {
  it("catches an inside-out shell by sign of volume", () => {
    // The exact bug that shipped: geometry valid, faces vanish under FrontSide materials.
    const r = inspectMesh(invert(new BoxGeometry(1, 1, 1)));
    expect(r.signedVolume).toBeLessThan(0);
    expect(checkClosedShell(invert(new BoxGeometry(1, 1, 1))).join(" ")).toContain("inside-out");
  });

  it("catches a single flipped patch that the volume test would average away", () => {
    const broken = flipOneTriangle(new BoxGeometry(1, 1, 1));
    const r = inspectMesh(broken);
    expect(r.inconsistentEdges).toBeGreaterThan(0);
    // and the global check alone would NOT have caught it — volume is still positive
    expect(r.signedVolume).toBeGreaterThan(0);
  });

  it("catches a hole", () => {
    const r = inspectMesh(punchHole(new BoxGeometry(1, 1, 1)));
    expect(r.boundaryEdges).toBeGreaterThan(0);
    expect(checkClosedShell(punchHole(new BoxGeometry(1, 1, 1))).join(" ")).toContain("hole");
  });

  it("catches degenerate triangles", () => {
    const geo = new BufferGeometry();
    // two identical vertices ⇒ zero area
    geo.setAttribute(
      "position",
      new Float32BufferAttribute([0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0], 3),
    );
    expect(inspectMesh(geo).degenerateTriangles).toBeGreaterThan(0);
  });
});

describe("the shipped models are healthy shells", () => {
  // The real bodies, not stand-in primitives: concave outlines, post-placement warp, caps.
  // loft.test.ts checks a convex ellipse, which is a weaker proxy than the geometry that ships.
  it("gamepad body", () => {
    const { group } = createGamepadModel();
    const body = group.getObjectByName("Body") as Mesh;
    // The controller's traced outline is concave enough that earcut emits 8 zero-area slivers on
    // the caps. They are declared, not ignored: no area means no pixels and no normal
    // contribution, and deleting them is worse — it turns their edges into holes (tried: 8 removed
    // → 9 boundary edges). Everything that actually matters must still be clean.
    const problems = checkClosedShell(body.geometry, { maxDegenerate: 8 });
    expect(problems).toEqual([]);
    const r = inspectMesh(body.geometry);
    expect(r.boundaryEdges, "closed").toBe(0);
    expect(r.inconsistentEdges, "consistently wound").toBe(0);
    expect(r.signedVolume, "outward-facing").toBeGreaterThan(0);
  });

  it("phone body", () => {
    const { parts } = createPhoneModel();
    expect(checkClosedShell(parts.body.geometry)).toEqual([]);
  });

  it("laptop deck", () => {
    const { parts } = createLaptopModel();
    // ExtrudeGeometry with a bevel — a different construction path from the loft
    expect(checkClosedShell(parts.deck.geometry)).toEqual([]);
  });
});
