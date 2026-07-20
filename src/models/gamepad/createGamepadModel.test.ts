import { describe, expect, it } from "vitest";
import { Object3D, Vector3 } from "three";
import { createGamepadModel, GAMEPAD_CONTRACT } from "./createGamepadModel";
import { checkPartsContract, checkPartsOnSurface } from "../contract";

/**
 * L1 + semantic contract for the controller.
 *
 * The contract assertions here are the ones that would have caught the two real failures of this
 * model: parts sinking inside the shell after a loft-profile change, and the ABXY diamond
 * silently losing its arrangement. Neither is visible to the silhouette gate — the outline is
 * identical either way.
 */
const object3dParts = (parts: Record<string, unknown>): Record<string, Object3D> =>
  Object.fromEntries(
    Object.entries(parts).filter(([, v]) => v instanceof Object3D),
  ) as Record<string, Object3D>;

describe("createGamepadModel", () => {
  it("builds without a DOM", () => {
    expect(typeof document).toBe("undefined");
    const { group, parts } = createGamepadModel();
    expect(group.children.length).toBeGreaterThan(0);
    expect(parts.leftStick).toBeDefined();
  });

  it("keeps the promises a gamepad makes", () => {
    const { group, parts } = createGamepadModel();
    const violations = checkPartsContract(group, object3dParts(parts), GAMEPAD_CONTRACT);
    expect(violations.map((v) => `${v.kind}: ${v.detail}`)).toEqual([]);
  });

  it("DETECTS a part sunk into the shell — the failure that shipped once", () => {
    // Proof the detector fires, not just passes: push a button behind the face plate, exactly
    // what a bad depth profile does, and require the contract to notice.
    const { group, parts } = createGamepadModel();
    parts.buttonA.position.z -= 0.6;
    const violations = checkPartsContract(group, object3dParts(parts), GAMEPAD_CONTRACT);
    expect(violations.some((v) => v.kind === "buried" && v.detail.includes("buttonA"))).toBe(true);
  });

  it("DETECTS a part floating off the body", () => {
    const { group, parts } = createGamepadModel();
    parts.buttonB.position.z += 3;
    const violations = checkPartsContract(group, object3dParts(parts), GAMEPAD_CONTRACT);
    expect(violations.some((v) => v.kind === "floating" || v.kind === "stray")).toBe(true);
  });

  it("DETECTS a broken ABXY diamond", () => {
    const { group, parts } = createGamepadModel();
    // swap Y down below A — the arrangement no longer reads as a controller
    parts.buttonY.position.y = parts.buttonA.position.y - 0.3;
    const violations = checkPartsContract(group, object3dParts(parts), GAMEPAD_CONTRACT);
    expect(violations.some((v) => v.kind === "layout")).toBe(true);
  });

  it("DETECTS a part that is the wrong size for its class", () => {
    // Right place, right arrangement, on the surface — and absurdly large. Every other gate
    // stays green: the silhouette is unchanged and the diamond still holds.
    const { group, parts } = createGamepadModel();
    parts.buttonY.scale.setScalar(4);
    const violations = checkPartsContract(group, object3dParts(parts), GAMEPAD_CONTRACT);
    expect(violations.some((v) => v.kind === "proportion")).toBe(true);
  });

  it("DETECTS a pair that drifted out of symmetry", () => {
    const { group, parts } = createGamepadModel();
    parts.rightStick.scale.setScalar(1.4);
    const violations = checkPartsContract(group, object3dParts(parts), GAMEPAD_CONTRACT);
    expect(violations.some((v) => v.kind === "asymmetry")).toBe(true);
  });

  it("mounts every part on the face, none buried", () => {
    const { group, parts } = createGamepadModel();
    const report = checkPartsOnSurface(group, object3dParts(parts), new Vector3(0, 0, 1));
    expect(report.filter((r) => r.buried).map((r) => r.part)).toEqual([]);
  });

  it("takes a brand accent through options rather than hardcoding one", () => {
    const { parts } = createGamepadModel({ logoGlow: "#ff0000" });
    expect(parts.logoMaterial.emissive.getHexString()).toBe("ff0000");
  });

  it("is deterministic across calls", () => {
    const a = createGamepadModel();
    const b = createGamepadModel();
    const pos = (m: ReturnType<typeof createGamepadModel>) =>
      Array.from(
        (m.group.getObjectByName("Body") as never as { geometry: { attributes: { position: { array: Float32Array } } } })
          .geometry.attributes.position.array,
      );
    expect(pos(a)).toEqual(pos(b));
  });
});
