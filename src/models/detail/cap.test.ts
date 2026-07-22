import { Box3, Mesh, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { CAP_TOP, lathedCap } from "./cap";

/** Mean dot of each skirt vertex's normal with its own outward radius in XY. >0 = facing outward. */
const outwardness = (geo: ReturnType<typeof lathedCap>): number => {
  const pos = geo.getAttribute("position");
  const nor = geo.getAttribute("normal");
  let sum = 0;
  let n = 0;
  for (let i = 0; i < pos.count; i++) {
    const radial = new Vector3(pos.getX(i), pos.getY(i), 0);
    if (radial.length() < 1e-3) continue; // skip the axis point at the dish centre
    radial.normalize();
    sum += new Vector3(nor.getX(i), nor.getY(i), nor.getZ(i)).dot(radial);
    n++;
  }
  return n === 0 ? 0 : sum / n;
};

describe("lathedCap", () => {
  it("builds a cap that faces +Z, at the requested height", () => {
    const geo = lathedCap(0.13, 0.065);
    const box = new Box3().setFromObject(new Mesh(geo));
    // Skirt at z=0 up to the dished top near CAP_TOP·h — a shallow moulded cap, not a tall plug.
    expect(box.min.z).toBeCloseTo(0, 2);
    expect(box.max.z).toBeCloseTo(0.065 * CAP_TOP, 2);
    // Full radius at the skirt.
    expect(box.max.x).toBeCloseTo(0.13, 2);
  });

  it("winds outward, not into the cap", () => {
    // A lathe revolves around Y and the winding can come out inward; with FrontSide materials that
    // reads as an absent cap. The remote and gamepad both depend on this being right.
    expect(outwardness(lathedCap(0.13, 0.065))).toBeGreaterThan(0.3);
  });

  it("is deterministic — same numbers, same geometry", () => {
    const a = Array.from(lathedCap(0.1, 0.05).getAttribute("position").array);
    const b = Array.from(lathedCap(0.1, 0.05).getAttribute("position").array);
    expect(a).toEqual(b);
  });
});
