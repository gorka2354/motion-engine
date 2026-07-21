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

  it("mounts every FACE part on the face, none buried", () => {
    // Scoped to the front-face parts on purpose. This test used to sweep every part along +Z, and
    // that hardcoded axis was the very assumption that broke when the controller gained shoulders:
    // a trigger sits on the TOP face, so a +Z ray from it hits the face plate and reports it
    // buried. checkPartsContract now takes each part's mounting axis from its class entry; a test
    // that pins one axis for the whole model would keep asserting the old, wrong model of reality.
    const { group, parts } = createGamepadModel();
    const face = Object.fromEntries(
      Object.entries(object3dParts(parts)).filter(([k]) => !/^(trigger|bumper)/.test(k)),
    );
    const report = checkPartsOnSurface(group, face, new Vector3(0, 0, 1));
    expect(report.filter((r) => r.buried).map((r) => r.part)).toEqual([]);
  });

  it("has the parts its CLASS requires, not merely the ones the author remembered", () => {
    // The failure this exists for: the controller shipped with no triggers and no bumpers, while
    // its own header explained they were "not visible in the reference" — untrue, all five views
    // were on disk. `required` below could not catch it, because the author writes that list too.
    const { group, parts } = createGamepadModel();
    expect(checkPartsContract(group, object3dParts(parts), GAMEPAD_CONTRACT)).toEqual([]);
  });

  it("fails when a class-required part is dropped", () => {
    // A gate nobody has watched fire is a gate nobody knows works.
    const { group, parts } = createGamepadModel();
    const stripped = Object.fromEntries(
      Object.entries(object3dParts(parts)).filter(([k]) => k !== "triggerRight"),
    );
    const violations = checkPartsContract(group, stripped, GAMEPAD_CONTRACT);
    const undercount = violations.find((v) => v.kind === "under-count");
    expect(undercount).toBeDefined();
    // The message must carry the source, so the fix does not depend on remembering where 2 came from.
    expect(undercount!.detail).toContain("2 × trigger");
    expect(undercount!.detail).toContain("wikipedia");
  });

  it("fails when a required part is moved off its declared face", () => {
    // A count assertion alone is satisfied by two meshes named triggerLeft/triggerRight sitting
    // anywhere at all — including inside the shell. The face has to be geometric to mean anything.
    const { group, parts } = createGamepadModel();
    const p = object3dParts(parts);
    p.triggerRight.position.set(0, -0.2, 0); // into the middle of the body
    const violations = checkPartsContract(group, p, GAMEPAD_CONTRACT);
    expect(violations.some((v) => v.kind === "wrong-face")).toBe(true);
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
