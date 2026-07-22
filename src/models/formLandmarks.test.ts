import { describe, expect, it } from "vitest";
import { checkWaist } from "./formLandmarks";
import { createGamepadModel } from "./gamepad/createGamepadModel";
import { createPhoneModel } from "./phone/createPhoneModel";
import { OBJECT_CLASSES } from "./knowledge/objectClasses";

/**
 * L1 for the form-landmark gate — the tool added the moment the gamepad's grips gained a defined
 * neck, so a future outline edit can't silently revert them to one mass.
 */
describe("checkWaist", () => {
  it("passes the gamepad — its grips neck in below the shoulder", () => {
    const { group } = createGamepadModel();
    expect(checkWaist(group, OBJECT_CLASSES.gamepad.waist!)).toEqual([]);
  });

  it("fires on a silhouette with no waist (a slab)", () => {
    // The phone body is a rounded rect — near-constant width through the middle, no neck. Checked
    // with a waist landmark it must complain: a constant/monotonic silhouette is the 'one mass'
    // failure the landmark exists to catch.
    const { group } = createPhoneModel();
    const v = checkWaist(group, { mesh: "Body", atY: [0.4, 0, -0.4], ratio: 0.99 });
    expect(v.some((x) => x.kind === "form")).toBe(true);
  });

  it("reports a missing mesh rather than passing", () => {
    const { group } = createGamepadModel();
    const v = checkWaist(group, { mesh: "Nope", atY: [0.2, -0.4, -0.6], ratio: 0.99 });
    expect(v[0].kind).toBe("form");
  });
});
