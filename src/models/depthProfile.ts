import { Box3, DoubleSide, Mesh, Raycaster, Vector3 } from "three";
import type { Group, Material } from "three";
import type { DepthProfile } from "./knowledge/objectClasses";
import type { ContractViolation } from "./contract";

/**
 * Depth-DISTRIBUTION check: does the shell carry its thickness where the object actually does?
 *
 * WHY THIS EXISTS, AND WHY THE OBVIOUS VERSION IS DEAD. The controller that started all this had
 * a correct head-on silhouette and its volume in the wrong place — the centre housing inflated to
 * the depth of the grips. No gate caught it: the silhouette is unchanged, and check-fidelity's
 * flatness test passes a rounded lump (it only fails a flat slab). A proposed fix measured the
 * Z-EXTENT of every vertex inside an X-window and compared centre-band to grip-band; implemented
 * against the fixed model it scored 0.998 where the bug scores 1.0 — zero discriminating power,
 * because a vertex band spans the full depth stack regardless of where the surface is.
 *
 * This measures the SURFACE instead. A ray fired at the face and out the back returns the shell's
 * actual thickness at that point. Sampled over the housing and over the grips, the two are plainly
 * different on a real controller (housing ≈0.71 of the grips, measured) and equal on the puffy bug.
 * On a phone or a laptop deck the whole field is uniform, and a factory that domed the back breaks
 * that uniformity — signal a class-derived model cannot give itself, which is the point (see the
 * note in objectClasses.ts about why phone/laptop carry real signal and the gamepad is weaker).
 *
 * Pure geometry: runs in the node test project, no renderer, so it gates in `npm test` not CI-only.
 */

/** Shell thickness at a face point: distance between the first and last hit along the ray. */
export const thicknessAt = (
  mesh: Mesh,
  at: [number, number],
  axis: [number, number, number],
): number | null => {
  mesh.updateWorldMatrix(true, true);
  const box = new Box3().setFromObject(mesh);
  const size = box.getSize(new Vector3());
  const centre = box.getCenter(new Vector3());
  const ax = new Vector3(...axis).normalize();
  // The two axes perpendicular to the ray. `at` is a fraction of the mesh half-extent along each,
  // so the probe grid scales with the model instead of being pinned to one size. Cardinal axes
  // keep their WORLD-axis basis (X-then-Y for +Z, X-then-Z for +Y), which is what the authored
  // probe coordinates assume. A non-cardinal axis — a slanted face on a future class — drops both
  // in-plane world axes under the |dot|<0.5 filter, leaving basis[1] undefined and crashing; those
  // fall back to a cross-product basis instead. (Found by adversarial review, not by a shipped
  // profile: every profile today is +Z or +Y.)
  let basis = [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)].filter(
    (b) => Math.abs(b.dot(ax)) < 0.5,
  );
  if (basis.length < 2) {
    const seed = Math.abs(ax.x) < 0.9 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0);
    const p0 = seed.clone().cross(ax).normalize();
    basis = [p0, ax.clone().cross(p0).normalize()];
  }
  const half = (v: Vector3): number =>
    (Math.abs(v.x) * size.x + Math.abs(v.y) * size.y + Math.abs(v.z) * size.z) / 2;
  const origin = centre
    .clone()
    .addScaledVector(basis[0], at[0] * half(basis[0]))
    .addScaledVector(basis[1], at[1] * half(basis[1]))
    .addScaledVector(ax, half(ax) * 4); // start well outside the mesh and fire inward

  // Raycaster honours material.side, and shell materials are FrontSide — a ray entering from
  // outside hits the front face fine, but the far wall is a back-face and would be discarded,
  // halving the hit count and reading as a miss. Flip to DoubleSide for the cast, restore after.
  const mats: Material[] = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const saved = mats.map((m) => m.side);
  mats.forEach((m) => (m.side = DoubleSide));
  try {
    const hits = new Raycaster(origin, ax.clone().negate(), 0.001, half(ax) * 10).intersectObject(
      mesh,
      true,
    );
    if (hits.length < 2) return null;
    return hits[hits.length - 1].distance - hits[0].distance;
  } finally {
    mats.forEach((m, i) => (m.side = saved[i]));
  }
};

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Raw thickness at every probe, by name. Exposed so calibration can print the field. */
export const measureDepthField = (root: Group, profile: DepthProfile): Record<string, number | null> => {
  const mesh = root.getObjectByName(profile.mesh);
  if (!(mesh instanceof Mesh)) return {};
  return Object.fromEntries(
    profile.probes.map((p) => [p.name, thicknessAt(mesh, p.at, profile.axis)]),
  );
};

/**
 * Assert a class's depth profile against a built model.
 *
 * @param severity how a violation is reported — "error" by default, because a profile encodes a
 *   physical invariant calibrated against the known-good model with margin, not a recalled figure.
 */
export const checkDepthProfile = (
  root: Group,
  profile: DepthProfile,
  severity: "error" | "warning" = profile.severity ?? "error",
): ContractViolation[] => {
  const mesh = root.getObjectByName(profile.mesh);
  if (!(mesh instanceof Mesh)) {
    return [{ kind: "depth", severity, detail: `depth profile names mesh "${profile.mesh}", not found` }];
  }

  if (!profile.probes.length) {
    return [{ kind: "depth", severity, detail: `depth profile for "${profile.mesh}" declares no probes` }];
  }

  const field = measureDepthField(root, profile);
  const violations: ContractViolation[] = [];
  const missed = Object.entries(field).filter(([, v]) => v === null).map(([k]) => k);
  if (missed.length) {
    violations.push({
      kind: "depth",
      severity,
      detail: `depth probe(s) ${missed.join(", ")} missed mesh "${profile.mesh}" — the shell is ` +
        `not where the profile expects it`,
    });
  }
  const byRole = (role: string): number[] =>
    profile.probes
      .filter((p) => p.role === role)
      .map((p) => field[p.name])
      .filter((v): v is number => v !== null);

  for (const rel of profile.thinner ?? []) {
    const a = byRole(rel.region);
    const b = byRole(rel.thanRegion);
    if (!a.length || !b.length) continue;
    // MAX of the thin region against the MEDIAN of the thick one. Max, not median, on the numerator
    // so a single probe inflating to grip depth is caught — the median over four housing probes
    // would hide one localized bulge (adversarial review's confirmed hole). Median on the
    // denominator so one grip-probe outlier can't push the ratio up into a false positive.
    const ratio = Math.max(...a) / median(b);
    if (ratio > rel.ratio) {
      violations.push({
        kind: "depth",
        severity,
        detail:
          `${rel.region} should be at most ${rel.ratio} of ${rel.thanRegion} thickness, measured ` +
          `${ratio.toFixed(3)} (max ${Math.max(...a).toFixed(3)} vs median ${median(b).toFixed(3)}) — ` +
          `the ${rel.region} is carrying too much depth, the failure that reads as a puffy cushion`,
      });
    }
  }

  if (profile.uniformWithin !== undefined) {
    const all = Object.values(field).filter((v): v is number => v !== null);
    if (all.length) {
      const spread = Math.max(...all) / Math.min(...all);
      if (spread > profile.uniformWithin) {
        violations.push({
          kind: "depth",
          severity,
          detail:
            `${profile.mesh} thickness should be within ${profile.uniformWithin}× across the face, ` +
            `measured ${spread.toFixed(2)}× (${Math.min(...all).toFixed(3)}–${Math.max(...all).toFixed(3)}) ` +
            `— a slab that thickens somewhere is a domed panel, not a flat one`,
        });
      }
    }
  }
  return violations;
};
