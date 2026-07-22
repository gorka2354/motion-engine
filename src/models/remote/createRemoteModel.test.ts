import { Box3, Group, Mesh, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { checkPartsContract, checkPartsOnSurface } from "../contract";
import { REMOTE_CONTRACT, createRemoteModel } from "./createRemoteModel";

/**
 * L1/L2 for the remote — the object built to test the one-pass pipeline. The headline test is that
 * it satisfies its CLASS contract with no violations: the count gate sees all 21 controls, every
 * key is on the front face, and the proportions and depth profile hold.
 */
const object3d = (parts: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(parts).filter(([, v]) => (v as { isObject3D?: boolean })?.isObject3D),
  ) as never;

describe("createRemoteModel", () => {
  it("builds and keeps its class contract — counts, faces, proportions, depth", () => {
    const { group, parts } = createRemoteModel();
    expect(checkPartsContract(group, object3d(parts), REMOTE_CONTRACT)).toEqual([]);
  });

  it("exposes every class-required control by name, the d-pad's lesson applied", () => {
    // A built-but-unexposed part is a part no gate can check. The pad and function keys are placed
    // in a loop and must all reach `parts`.
    const { parts } = createRemoteModel();
    const numbers = Object.keys(parts).filter((k) => /^num\d\d$/.test(k));
    const fns = Object.keys(parts).filter((k) => /^fn/.test(k));
    expect(numbers).toHaveLength(12);
    expect(fns).toHaveLength(4);
    expect(parts.navpad).toBeDefined();
  });

  it("seats every key on the front face, none buried", () => {
    const { group, parts } = createRemoteModel();
    const report = checkPartsOnSurface(group, object3d(parts), new Vector3(0, 0, 1));
    expect(report.filter((r) => r.buried).map((r) => r.part)).toEqual([]);
    expect(report.filter((r) => r.floating).map((r) => r.part)).toEqual([]);
  });

  it("is deterministic across calls", () => {
    const geo = (m: ReturnType<typeof createRemoteModel>) =>
      Array.from(
        (m.group.getObjectByName("Body") as never as { geometry: { attributes: { position: { array: Float32Array } } } })
          .geometry.attributes.position.array,
      );
    expect(geo(createRemoteModel())).toEqual(geo(createRemoteModel()));
  });

  it("takes a brand chassis colour through options", () => {
    const { parts } = createRemoteModel({ bodyColor: "#112233" });
    expect(parts.bodyMaterial.color.getHexString()).toBe("112233");
  });

  it("prints a legend on every labelled key — a cap plus a legend mesh, not a blank pill", () => {
    // The whole point of Stage 1: keys carry real marks. Each labelled button Group is a lathed cap
    // plus a legend child, so a numeral/glyph triangulated and got mounted.
    const { parts } = createRemoteModel();
    for (const key of ["num00", "num10", "powerL", "fnMenu"]) {
      const g = parts[key] as Group;
      const meshes = g.children.filter((c): c is Mesh => (c as Mesh).isMesh);
      expect(meshes.length, `${key} should have a cap + a legend`).toBeGreaterThanOrEqual(2);
      // The legend mesh is non-empty geometry (a real extruded mark, not a degenerate outline).
      const legend = meshes[1];
      expect(legend.geometry.getAttribute("position").count).toBeGreaterThan(0);
      expect(new Box3().setFromObject(legend).isEmpty()).toBe(false);
    }
  });

  it("is deterministic across calls — body AND the detailed keys", () => {
    // The old test only covered the Body. Legends and lathed caps are new geometry that must also
    // be reproducible (hard rule #1): no Math.random, static label strings, cached glyph geometry.
    const dump = (m: ReturnType<typeof createRemoteModel>) => {
      const out: number[] = [];
      for (const name of ["Body", "num00", "powerL", "rockerL", "navpad"]) {
        (m.group.getObjectByName(name) as Group).traverse((o) => {
          const g = (o as Mesh).geometry;
          if (g) out.push(g.getAttribute("position").array.length);
        });
      }
      return out;
    };
    expect(dump(createRemoteModel())).toEqual(dump(createRemoteModel()));
  });
});
