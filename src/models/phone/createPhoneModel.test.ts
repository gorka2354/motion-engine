import { describe, expect, it } from "vitest";
import { Box3, Object3D, Vector3 } from "three";
import { createPhoneModel, PHONE_CONTRACT } from "./createPhoneModel";
import { checkPartsContract } from "../contract";

const object3dParts = (parts: Record<string, unknown>): Record<string, Object3D> =>
  Object.fromEntries(Object.entries(parts).filter(([, v]) => v instanceof Object3D)) as Record<
    string,
    Object3D
  >;

describe("createPhoneModel", () => {
  it("builds without a DOM", () => {
    expect(typeof document).toBe("undefined");
    const { group, parts } = createPhoneModel();
    expect(group.children.length).toBeGreaterThan(0);
    expect(parts.screen).toBeDefined();
  });

  it("keeps the promises a phone makes", () => {
    const { group, parts } = createPhoneModel();
    const violations = checkPartsContract(group, object3dParts(parts), PHONE_CONTRACT);
    expect(violations.map((v) => `${v.kind}: ${v.detail}`)).toEqual([]);
  });

  it("DETECTS a screen that outgrew its bezel", () => {
    const { group, parts } = createPhoneModel();
    parts.screen.scale.x = 1.4; // wider than the body it sits on
    const violations = checkPartsContract(group, object3dParts(parts), PHONE_CONTRACT);
    expect(violations.some((v) => v.kind === "proportion")).toBe(true);
  });

  it("DETECTS a camera island moved to the front", () => {
    const { group, parts } = createPhoneModel();
    parts.cameraIsland.position.z = 1; // now in front of the glass
    const violations = checkPartsContract(group, object3dParts(parts), PHONE_CONTRACT);
    expect(violations.some((v) => v.kind === "layout")).toBe(true);
  });

  it("exposes the screen material so a scene can mount real UI on it", () => {
    // The factory must not load images itself — that reintroduces the delayRender race (rule #6).
    // Handing the material out lets a component that DOES own loading attach a texture.
    const { parts } = createPhoneModel();
    expect(parts.screenMaterial.emissive.getHex()).toBeGreaterThan(0);
    expect(parts.screenMaterial.map).toBeNull();
  });

  it("dims the display when screenOn is 0", () => {
    expect(createPhoneModel({ screenOn: 0 }).parts.screenMaterial.emissiveIntensity).toBe(0);
    expect(
      createPhoneModel({ screenOn: 1 }).parts.screenMaterial.emissiveIntensity,
    ).toBeGreaterThan(0);
  });

  it("takes a brand accent through options", () => {
    const { parts } = createPhoneModel({ bodyColor: "#ff0000" });
    expect(parts.bodyMaterial.color.getHexString()).toBe("ff0000");
  });

  it("is a thin slab, not a brick", () => {
    const { group } = createPhoneModel();
    group.updateMatrixWorld(true);
    const size = new Box3().setFromObject(group).getSize(new Vector3());
    expect(size.z / size.x).toBeLessThan(0.35); // depth vs width, camera island included
    expect(size.y).toBeGreaterThan(size.x); // portrait
  });

  it("is deterministic across calls", () => {
    const a = createPhoneModel();
    const b = createPhoneModel();
    const pos = (m: ReturnType<typeof createPhoneModel>) =>
      Array.from(m.parts.body.geometry.getAttribute("position").array as Float32Array);
    expect(pos(a)).toEqual(pos(b));
  });
});
