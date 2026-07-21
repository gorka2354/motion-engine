import { describe, expect, it } from "vitest";
import { Box3, Mesh, Vector2, Vector3 } from "three";
import { lensSections, loftGeometry } from "./loft";
import { inspectMesh } from "./meshHealth";

/**
 * L1 for the loft.
 *
 * The headline test is the normal direction, and it exists because its absence cost real time:
 * the phone body rendered with a see-through side, and the reason turned out to be inward-facing
 * normals — with FrontSide materials an inside-out shell doesn't look wrong, it looks ABSENT, so
 * the backdrop shows through and it reads like a missing face rather than a winding bug.
 * Geometry that is silently inside-out is exactly the class of defect a unit test should own.
 */
const ellipseRing = (rx: number, ry: number, n = 32): Vector2[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return new Vector2(Math.cos(a) * rx, Math.sin(a) * ry);
  });

/** Mean dot of each side vertex's normal with its own outward radius. >0 = facing outward. */
const outwardness = (geo: ReturnType<typeof loftGeometry>): number => {
  const pos = geo.getAttribute("position");
  const nor = geo.getAttribute("normal");
  let sum = 0;
  let n = 0;
  for (let i = 0; i < pos.count; i++) {
    const radial = new Vector3(pos.getX(i), pos.getY(i), 0);
    if (radial.length() < 1e-6) continue;
    radial.normalize();
    sum += new Vector3(nor.getX(i), nor.getY(i), nor.getZ(i)).dot(radial);
    n++;
  }
  return n === 0 ? 0 : sum / n;
};

describe("loftGeometry", () => {
  it("builds normals that face OUTWARD, not into the shell", () => {
    const geo = loftGeometry(ellipseRing(1, 2), [
      { z: -0.2, scale: 0.9 },
      { z: 0, scale: 1 },
      { z: 0.2, scale: 0.9 },
    ]);
    expect(outwardness(geo)).toBeGreaterThan(0.3);
  });

  it("gives the same result whichever way the outline was traced", () => {
    // Callers shouldn't have to know the winding convention — one model was drawn clockwise and
    // another counter-clockwise, and both must come out solid.
    const sections = [
      { z: -0.2, scale: 0.9 },
      { z: 0.2, scale: 0.9 },
    ];
    const cw = loftGeometry(ellipseRing(1, 2).reverse(), sections);
    const ccw = loftGeometry(ellipseRing(1, 2), sections);
    expect(outwardness(cw)).toBeGreaterThan(0.3);
    expect(outwardness(ccw)).toBeGreaterThan(0.3);
  });

  it("scales each section, so the shell bulges instead of running straight", () => {
    const geo = loftGeometry(ellipseRing(1, 1), [
      { z: -1, scale: 0.2 },
      { z: 0, scale: 1 },
      { z: 1, scale: 0.2 },
    ]);
    const box = new Box3().setFromObject(new Mesh(geo));
    expect(box.max.x).toBeCloseTo(1, 1); // widest section reaches full radius
    expect(box.max.z).toBeCloseTo(1, 1);
  });

  it("applies warp after placement", () => {
    const straight = loftGeometry(ellipseRing(1, 1), lensSections(1, 5));
    const bent = loftGeometry(ellipseRing(1, 1), lensSections(1, 5), {
      warp: (x, y, z) => [x, y, z - (y < 0 ? 1 : 0)],
    });
    const boxA = new Box3().setFromObject(new Mesh(straight));
    const boxB = new Box3().setFromObject(new Mesh(bent));
    expect(boxB.min.z).toBeLessThan(boxA.min.z);
  });

  it("faces the caps outward too — front toward +Z, back toward -Z", () => {
    // Caps and sides follow different winding rules. Flipping both together looks like a fix,
    // leaves the sides correct, and quietly punches a hole through the front of the object —
    // which is exactly what happened, and what this test now prevents.
    const geo = loftGeometry(ellipseRing(1, 1), [
      { z: -0.5, scale: 1 },
      { z: 0.5, scale: 1 },
    ]);
    // Vertex normals can't answer this: caps and sides SHARE vertices, so computeVertexNormals
    // averages the two and no vertex carries a clean cap normal. Face normals do.
    const pos = geo.getAttribute("position");
    const index = geo.getIndex()!;
    const v = (i: number) => new Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
    let front: number | null = null;
    let back: number | null = null;
    for (let t = 0; t < index.count; t += 3) {
      const a = v(index.getX(t));
      const b = v(index.getX(t + 1));
      const c = v(index.getX(t + 2));
      // a cap triangle is flat in Z
      if (Math.abs(a.z - b.z) > 1e-6 || Math.abs(b.z - c.z) > 1e-6) continue;
      const n = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
      if (a.z > 0) front ??= n.z;
      else back ??= n.z;
    }
    expect(front, "a front cap triangle exists").not.toBeNull();
    expect(back, "a back cap triangle exists").not.toBeNull();
    expect(front!).toBeGreaterThan(0.9);
    expect(back!).toBeLessThan(-0.9);
  });

  it("closes both ends when capped", () => {
    const open = loftGeometry(ellipseRing(1, 1), [
      { z: -1, scale: 1 },
      { z: 1, scale: 1 },
    ], { caps: false });
    const closed = loftGeometry(ellipseRing(1, 1), [
      { z: -1, scale: 1 },
      { z: 1, scale: 1 },
    ]);
    const tris = (g: ReturnType<typeof loftGeometry>) => (g.getIndex()?.count ?? 0) / 3;
    expect(tris(closed)).toBeGreaterThan(tris(open));
  });

  it("rejects degenerate input rather than producing a broken mesh", () => {
    expect(() => loftGeometry([new Vector2(0, 0)], [{ z: 0, scale: 1 }])).toThrow();
    expect(() => loftGeometry(ellipseRing(1, 1), [{ z: 0, scale: 1 }])).toThrow();
  });

  /**
   * The winding tests above all use stacks where sections SCALE one base contour, and that hid a
   * real bug for as long as it existed: normalisation was applied to the base outline only. On a
   * morphing stack every section supplies its own ring, so the base contributes no vertices at
   * all — normalising it normalised nothing, and the gamepad shell came out wholly inside-out
   * (signedVolume −11.9, 256 inconsistent edges). On screen that is not a visibly wrong shape, it
   * is a hole you can see the backdrop through, which got misread twice as a geometry fault.
   *
   * Topology is asserted rather than normals: with a morphing stack, vertex normals are averaged
   * across cap and side faces and cannot answer whether the shell is consistently wound.
   */
  it("stays right-side out when every section supplies its OWN outline", () => {
    // Clockwise on purpose — the direction a caller has no reason to think about.
    const cw = (rx: number, ry: number): Vector2[] => ellipseRing(rx, ry).slice().reverse();
    const geo = loftGeometry(cw(1, 2), [
      { z: -1, scale: 1, outline: cw(0.5, 1.2) },
      { z: 0, scale: 1, outline: cw(1, 2) },
      { z: 1, scale: 1, outline: cw(0.8, 1.6) },
    ]);
    const health = inspectMesh(geo);
    expect(health.boundaryEdges).toBe(0); // closed
    expect(health.inconsistentEdges).toBe(0); // caps agree with sides
    expect(health.signedVolume).toBeGreaterThan(0); // and the whole thing faces outward
  });

  it("refuses a stack whose outlines wind opposite ways", () => {
    // Sections skin index-to-index, so one reversed ring twists the skin into a knot. Better to
    // fail loudly than to hand back a mesh that only looks wrong from certain angles.
    expect(() =>
      loftGeometry(ellipseRing(1, 1), [
        { z: -1, scale: 1, outline: ellipseRing(1, 1) },
        { z: 1, scale: 1, outline: ellipseRing(1, 1).slice().reverse() },
      ]),
    ).toThrow(/wind opposite/);
  });

  it("lensSections bulges in the middle and rounds off at the ends", () => {
    const s = lensSections(2, 9);
    const mid = s[Math.floor(s.length / 2)];
    expect(mid.scale).toBeGreaterThan(s[0].scale as number);
    expect(mid.scale).toBeGreaterThan(s[s.length - 1].scale as number);
  });
});
