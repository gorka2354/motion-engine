import { Box3, Mesh, Vector3 } from "three";
import type { Group } from "three";
import type { WaistLandmark } from "./knowledge/objectClasses";
import type { ContractViolation } from "./contract";

/**
 * Form-landmark checks: geometric assertions about the SHAPE that the other gates miss.
 *
 * WHY THIS EXISTS. meshHealth checks topology, contract checks parts and proportions, depthProfile
 * checks how depth is distributed, check-fidelity checks the FRONT silhouette. None of them can say
 * whether the 3D FORM matches — whether a controller's grips are defined or read as one mass, or
 * whether a shoulder shelf exists. Those are the features you can only see in a three-quarter view,
 * and until now they were checked by eye, which is exactly the many-iteration loop the class-input
 * approach is meant to end.
 *
 * A form landmark is the same idea as a depth profile, one axis over: the class declares a shape
 * feature ("the silhouette necks in below the shoulder"), and this measures it on the mesh. No
 * reference photo, no camera pose to solve — pure geometry, node-testable. Built test-driven: each
 * landmark is added when a real form fix needs locking, not speculatively.
 */

/** Widest half-extent along X within a thin Y band — the silhouette's half-width at that height. */
export const halfWidthAt = (mesh: Mesh, y: number, band: number): number => {
  const pos = mesh.geometry.getAttribute("position");
  let w = 0;
  for (let i = 0; i < pos.count; i++) {
    if (Math.abs(pos.getY(i) - y) <= band) w = Math.max(w, Math.abs(pos.getX(i)));
  }
  return w;
};

/**
 * A WAIST: the silhouette narrows between two wider bands (shoulder above, grip below). A monotonic
 * taper — the failure that reads as grips fused into one mass — has no local minimum and fails this.
 *
 * `atY` are fractions of the mesh's own half-height, so the check is scale-independent.
 */
export const checkWaist = (
  root: Group,
  landmark: WaistLandmark,
  severity: "error" | "warning" = "error",
): ContractViolation[] => {
  const mesh = root.getObjectByName(landmark.mesh);
  if (!(mesh instanceof Mesh)) {
    return [{ kind: "form", severity, detail: `waist landmark names mesh "${landmark.mesh}", not found` }];
  }
  mesh.updateWorldMatrix(true, true);
  const halfH = new Box3().setFromObject(mesh).getSize(new Vector3()).y / 2;
  const band = halfH * 0.09;
  const [shoulderF, waistF, gripF] = landmark.atY;
  const shoulder = halfWidthAt(mesh, shoulderF * halfH, band);
  const waist = halfWidthAt(mesh, waistF * halfH, band);
  const grip = halfWidthAt(mesh, gripF * halfH, band);
  const flank = Math.min(shoulder, grip);
  if (waist > flank * landmark.ratio) {
    return [
      {
        kind: "form",
        severity,
        detail:
          `silhouette has no waist: half-width at the neck is ${waist.toFixed(3)}, not below ` +
          `${(flank * landmark.ratio).toFixed(3)} (shoulder ${shoulder.toFixed(3)}, grip ${grip.toFixed(3)}) ` +
          `— the grips read as one mass with the body rather than necking in`,
      },
    ];
  }
  return [];
};
