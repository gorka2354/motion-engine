import { Group, Mesh, MeshStandardMaterial } from "three";
import { describe, expect, it } from "vitest";
import { checkPartsContract } from "./contract";
import { checkDepthProfile, thicknessAt } from "./depthProfile";
import { loftGeometry } from "./loft";
import { OBJECT_CLASSES } from "./knowledge/objectClasses";
import { GAMEPAD_CONTRACT, createGamepadModel } from "./gamepad/createGamepadModel";
import { PHONE_CONTRACT, createPhoneModel } from "./phone/createPhoneModel";
import { LAPTOP_CONTRACT, createLaptopModel } from "./laptop/createLaptopModel";
import { FACE_Z, frontOutline } from "./gamepad/gamepadForm";
import type { DepthProfile } from "./knowledge/objectClasses";

/**
 * L1 for the depth-distribution gate.
 *
 * The bug it exists for: a controller with a correct head-on silhouette and its volume in the
 * wrong place — the centre housing inflated to the depth of the grips. Nothing caught it, because
 * the silhouette never changed and the flatness check only fails a flat slab. These tests pin two
 * things: the gate passes the three known-good models it was calibrated against, and it FIRES on
 * that specific failure reproduced. A gate whose failure has never been watched is not a gate.
 */

const object3d = (parts: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(parts).filter(([, v]) => (v as { isObject3D?: boolean })?.isObject3D),
  ) as never;

const depthOnly = (v: ReturnType<typeof checkPartsContract>) => v.filter((x) => x.kind === "depth");

describe("checkDepthProfile", () => {
  it("passes all three known-good models (the calibration guard)", () => {
    const gp = createGamepadModel();
    const ph = createPhoneModel();
    const lp = createLaptopModel();
    expect(depthOnly(checkPartsContract(gp.group, object3d(gp.parts), GAMEPAD_CONTRACT))).toEqual([]);
    expect(depthOnly(checkPartsContract(ph.group, object3d(ph.parts), PHONE_CONTRACT))).toEqual([]);
    expect(depthOnly(checkPartsContract(lp.group, object3d(lp.parts), LAPTOP_CONTRACT))).toEqual([]);
  });

  it("fires on a puffy gamepad — housing inflated to grip depth", () => {
    // Reproduce the original bug: every section at the full outline and full scale, so the centre
    // housing is as deep as the grips. The head-on silhouette is identical to the good model's.
    const outline = frontOutline();
    const body = new Mesh(
      loftGeometry(outline, [
        { z: FACE_Z - 1.57, scale: 1.0, outline },
        { z: FACE_Z - 0.8, scale: 1.0, outline },
        { z: FACE_Z - 0.3, scale: 1.0, outline },
        { z: FACE_Z, scale: 0.95, outline },
      ]),
      new MeshStandardMaterial(),
    );
    body.name = "Body";
    const group = new Group();
    group.add(body);
    const violations = checkDepthProfile(group, OBJECT_CLASSES.gamepad.depthProfile!);
    expect(violations.some((v) => v.kind === "depth")).toBe(true);
    expect(violations[0].detail).toMatch(/puffy cushion/);
  });

  it("the uniformity branch rejects a genuinely non-uniform shell", () => {
    // A lofted body cannot dome its own centre — every section's vertices share a z, so scaling a
    // ring changes width, never depth under the middle. So a phone loft can't trip the uniformity
    // branch by perturbation; it guards a different future (an extruded body, a merged bump, a bad
    // bevel). To prove the branch has teeth, run a uniform profile against the gamepad body, whose
    // housing and grips differ by ~1.9×, and require a complaint.
    const gp = createGamepadModel();
    const profile: DepthProfile = {
      mesh: "Body",
      axis: [0, 0, 1],
      probes: [
        { name: "centre", at: [0, 0] },
        { name: "upper", at: [0, 0.4] },
        { name: "grip", at: [0.72, -0.45] },
      ],
      uniformWithin: 1.4,
    };
    expect(checkDepthProfile(gp.group, profile).some((v) => /within/.test(v.detail))).toBe(true);
  });

  it("reports a probe that misses the shell instead of silently passing", () => {
    const gp = createGamepadModel();
    const body = gp.group.getObjectByName("Body") as Mesh;
    // A point past the outline hits nothing — the raycast returns null, not a bogus thickness.
    expect(thicknessAt(body, [3, 3], [0, 0, 1])).toBeNull();
  });

  it("survives a non-cardinal axis instead of crashing on an undefined basis", () => {
    // No shipped profile uses a slanted axis, but the gate is meant for reuse on new classes, and
    // the world-axis filter dropped BOTH in-plane axes for a diagonal, leaving basis[1] undefined.
    // A cross-product fallback covers it; here it just has to return a number, not throw.
    const gp = createGamepadModel();
    const body = gp.group.getObjectByName("Body") as Mesh;
    expect(() => thicknessAt(body, [0, 0], [1, 1, 1])).not.toThrow();
  });
});
