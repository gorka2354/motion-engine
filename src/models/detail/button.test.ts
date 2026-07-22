import { Box3, Mesh, MeshStandardMaterial } from "three";
import { describe, expect, it } from "vitest";
import { button } from "./button";
import { textGeometry } from "./text";

const capMat = new MeshStandardMaterial();
const legendMat = new MeshStandardMaterial();

describe("button", () => {
  it("is a named Group so the part gates still see one control", () => {
    const b = button("num05", { radius: 0.13, capMaterial: capMat });
    expect(b.name).toBe("num05");
    expect(b.type).toBe("Group");
  });

  it("composes a cap plus a legend when one is given", () => {
    const b = button("num05", {
      radius: 0.13,
      capMaterial: capMat,
      legend: textGeometry("5", { size: 0.1, depth: 0.012 }),
      legendMaterial: legendMat,
    });
    const meshes = b.children.filter((c): c is Mesh => (c as Mesh).isMesh);
    expect(meshes).toHaveLength(2); // cap + legend
    // The legend sits proud on the cap, above z=0, not buried in the skirt.
    const legend = meshes[1];
    expect(legend.position.z).toBeGreaterThan(0);
    expect(new Box3().setFromObject(legend).isEmpty()).toBe(false);
  });

  it("is just a cap when no legend is given", () => {
    const b = button("blank", { radius: 0.1, capMaterial: capMat });
    expect(b.children.filter((c): c is Mesh => (c as Mesh).isMesh)).toHaveLength(1);
  });

  it("skips the legend if a geometry is given without a material — no half-built mesh", () => {
    const b = button("x", { radius: 0.1, capMaterial: capMat, legend: textGeometry("1", { size: 0.1, depth: 0.01 }) });
    expect(b.children.filter((c): c is Mesh => (c as Mesh).isMesh)).toHaveLength(1);
  });
});
