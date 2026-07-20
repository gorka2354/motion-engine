import { describe, expect, it } from "vitest";
import { Box3, Mesh, Object3D, Vector3 } from "three";
import { createLaptopModel, LAPTOP_CONTRACT } from "./createLaptopModel";
import { checkPartsContract } from "../contract";

/**
 * L1 for a procedural model factory.
 *
 * The headline assertion is the one that never appears as an expect(): this file runs in the
 * vitest `node` project, where `document` does not exist. A factory that reached for a canvas
 * texture (as img2threejs' generated code does) would throw on import here. Staying DOM-free is
 * what makes the model unit-testable at all.
 */
describe("createLaptopModel", () => {
  it("builds without a DOM and exposes its animated parts", () => {
    expect(typeof document).toBe("undefined"); // guards the premise above
    const { group, parts } = createLaptopModel();
    expect(group.children.length).toBeGreaterThan(0);
    expect(parts.lid).toBeDefined();
    expect(parts.screenMaterial.emissive.getHex()).toBeGreaterThan(0);
  });

  it("pivots the lid on the hinge line, not through the deck", () => {
    const { group, parts } = createLaptopModel();
    const screen = parts.lid.getObjectByName("ScreenFace") as Mesh;

    // closed: the panel lies flat, just above the deck
    parts.lid.rotation.x = 0;
    group.updateMatrixWorld(true);
    const closed = new Vector3();
    screen.getWorldPosition(closed);

    // open: it swings up and back — and must never dip below the deck top
    parts.lid.rotation.x = -1.78;
    group.updateMatrixWorld(true);
    const open = new Vector3();
    screen.getWorldPosition(open);

    expect(open.y).toBeGreaterThan(closed.y + 0.5);
    expect(open.z).toBeLessThan(closed.z);
    expect(open.y).toBeGreaterThan(0);
  });

  it("keeps the deck within its authored footprint", () => {
    const { group } = createLaptopModel();
    group.updateMatrixWorld(true);
    const deck = group.getObjectByName("Deck") as Mesh;
    const box = new Box3().setFromObject(deck);
    const size = new Vector3();
    box.getSize(size);
    // spec: 3.2 x 0.09 x 2.15 — a drifting deck silently rescales the whole machine
    expect(size.x).toBeCloseTo(3.2, 1);
    expect(size.z).toBeCloseTo(2.15, 1);
    expect(size.y).toBeLessThan(0.15);
  });

  it("is deterministic across calls", () => {
    // Δ=0 depends on this: two builds of the same model must be byte-identical in geometry.
    const a = createLaptopModel();
    const b = createLaptopModel();
    const posOf = (m: ReturnType<typeof createLaptopModel>) => {
      const deck = m.group.getObjectByName("Deck") as Mesh;
      return Array.from(deck.geometry.getAttribute("position").array as Float32Array);
    };
    expect(posOf(a)).toEqual(posOf(b));
  });

  it("keeps the promises a laptop makes", () => {
    const { group, parts } = createLaptopModel();
    const objects = Object.fromEntries(
      Object.entries(parts).filter(([, v]) => v instanceof Object3D),
    ) as Record<string, Object3D>;
    const violations = checkPartsContract(group, objects, LAPTOP_CONTRACT);
    expect(violations.map((v) => `${v.kind}: ${v.detail}`)).toEqual([]);
  });

  it("DETECTS a keyboard that grew past its deck", () => {
    const { group, parts } = createLaptopModel();
    parts.keycaps.scale.x = 1.6; // wider than the machine it sits on
    const objects = Object.fromEntries(
      Object.entries(parts).filter(([, v]) => v instanceof Object3D),
    ) as Record<string, Object3D>;
    const violations = checkPartsContract(group, objects, LAPTOP_CONTRACT);
    expect(violations.some((v) => v.kind === "proportion")).toBe(true);
  });

  it("takes a brand accent through options rather than hardcoding one", () => {
    const { parts } = createLaptopModel({ screenGlow: "#ff0000" });
    expect(parts.screenMaterial.emissive.getHexString()).toBe("ff0000");
  });
});
