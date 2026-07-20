import { Box3, DoubleSide, Mesh, Object3D, Raycaster, Vector3 } from "three";
import type { Group } from "three";

/**
 * Semantic checks on an assembled model — "does this object actually have the things this KIND
 * of object has, and are they where they belong".
 *
 * WHY THIS LAYER EXISTS. Everything else checks a different question:
 *   - the sculpt spec's detailInventory checks that a detail was *described* (prose, not mesh);
 *   - check-fidelity measures the OUTSIDE silhouette;
 *   - the L2 scene-graph tests check that components mount.
 * None of them notices when parts are present, mounted, described — and buried inside the shell.
 *
 * That is not hypothetical: changing the gamepad's loft profile once moved the face plate behind
 * the buttons, and every stick, button and d-pad sank into the body. Silhouette unchanged, gates
 * green, tests green, model visibly empty. `assertOnSurface` is the check that would have failed
 * instantly.
 *
 * These run in the node test project — pure geometry, no renderer.
 */

/**
 * A part's world-space anchor — the CENTRE OF ITS BOUNDS, not its origin.
 *
 * `getWorldPosition` would be the obvious choice and is wrong here: an `InstancedMesh` keeps its
 * origin at zero and carries the real placement inside per-instance matrices, so a keyboard made
 * of 57 instances reports as sitting at the model's origin. Bounds centre is true for instanced
 * meshes, groups and plain meshes alike.
 */
const anchorOf = (part: Object3D, root: Group): Vector3 => {
  root.updateMatrixWorld(true);
  const box = new Box3().setFromObject(part);
  return box.isEmpty() ? part.getWorldPosition(new Vector3()) : box.getCenter(new Vector3());
};

/** Every mesh in the model except the parts themselves — i.e. the shell to test against. */
const shellMeshes = (root: Group, exclude: Object3D[]): Mesh[] => {
  const excluded = new Set<Object3D>();
  for (const part of exclude) part.traverse((o) => excluded.add(o));
  const out: Mesh[] = [];
  root.traverse((o) => {
    if (o instanceof Mesh && !excluded.has(o)) out.push(o);
  });
  return out;
};

export interface SurfaceReport {
  part: string;
  /** The part's origin is inside the shell — it sank in. */
  buried: boolean;
  /** No body close behind the part — it floats off the object. */
  floating: boolean;
  /** Distance from the part back to the shell, or null if nothing is behind it at all. */
  gap: number | null;
}

/**
 * Is each part sitting ON the shell?
 *
 * Two rays from the part's origin along the mount axis:
 *   - outward: anything hit means shell is in FRONT of the part ⇒ the part is buried;
 *   - inward: nothing hit, or a hit further away than `maxGap` ⇒ the part floats.
 *
 * Two traps this had to survive, both found by the tests that assert the detector FIRES:
 *
 * 1. `Raycaster` honours `material.side`. Shell materials are FrontSide, so a ray starting
 *    inside the body hits the front face from behind and is silently discarded — the buried
 *    case, the very thing being detected, would never report. Materials are flipped to
 *    DoubleSide for the duration of the cast and restored after.
 * 2. "Is there body behind it" is not enough for floating: a part shoved far in front still has
 *    the body behind it, just distant. Distance is what matters.
 *
 * @param axis direction the parts face; defaults to +Z (how the model factories mount them)
 */
export const checkPartsOnSurface = (
  root: Group,
  parts: Record<string, Object3D>,
  axis: Vector3 = new Vector3(0, 0, 1),
  maxGap = 0.35,
): SurfaceReport[] => {
  const shell = shellMeshes(root, Object.values(parts));
  const out: Vector3 = axis.clone().normalize();
  const back: Vector3 = out.clone().negate();

  const restore = shell.map((mesh) => {
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const sides = mats.map((m) => m.side);
    mats.forEach((m) => (m.side = DoubleSide));
    return () => mats.forEach((m, i) => (m.side = sides[i]));
  });

  try {
    return Object.entries(parts).map(([name, part]) => {
      const origin = anchorOf(part, root);
      const outward = new Raycaster(origin, out, 0.002, 50).intersectObjects(shell, true);
      const inward = new Raycaster(origin, back, 0.002, 50).intersectObjects(shell, true);
      const gap = inward.length > 0 ? inward[0].distance : null;
      return {
        part: name,
        buried: outward.length > 0,
        floating: gap === null || gap > maxGap,
        gap,
      };
    });
  } finally {
    restore.forEach((fn) => fn());
  }
};

/** Parts that share (nearly) the same position — usually a copy-paste slip in the layout. */
export const findOverlappingParts = (
  root: Group,
  parts: Record<string, Object3D>,
  minDistance = 0.05,
): [string, string][] => {
  const entries = Object.entries(parts).map(
    ([name, part]) => [name, anchorOf(part, root)] as const,
  );
  const clashes: [string, string][] = [];
  for (let i = 0; i < entries.length; i++)
    for (let j = i + 1; j < entries.length; j++) {
      if (entries[i][1].distanceTo(entries[j][1]) < minDistance) {
        clashes.push([entries[i][0], entries[j][0]]);
      }
    }
  return clashes;
};

/**
 * Parts whose anchor lies outside the bounds of *everything else* — detached from the object.
 *
 * Measured per part against the rest of the model, not against a fixed "shell": a stray part is
 * itself part of the model, so the model's own bounds stretch to wherever it wandered off to and
 * it would always test as inside. Excluding only the part under test also survives the case
 * where nearly every mesh is a named part (the laptop exposes deck, keys and trackpad), which
 * would otherwise leave almost no body to compare against.
 */
export const findStrayParts = (
  root: Group,
  parts: Record<string, Object3D>,
  margin = 0.05,
): string[] => {
  root.updateMatrixWorld(true);
  return Object.entries(parts)
    .filter(([, part]) => {
      const rest = shellMeshes(root, [part]);
      if (rest.length === 0) return false;
      const box = new Box3();
      for (const mesh of rest) box.expandByObject(mesh);
      box.expandByScalar(margin);
      return !box.containsPoint(anchorOf(part, root));
    })
    .map(([name]) => name);
};

/**
 * Layout rule expressed the way a person describes an object: "Y is above A", "X is left of B".
 * Axis is compared in the model's local frame.
 */
export type LayoutRule = {
  of: string;
  is: "above" | "below" | "leftOf" | "rightOf" | "inFrontOf" | "behind";
  than: string;
};

export const checkLayout = (
  root: Group,
  parts: Record<string, Object3D>,
  rules: LayoutRule[],
): string[] => {
  const pos = (name: string): Vector3 => {
    const p = parts[name];
    if (!p) throw new Error(`layout rule references unknown part "${name}"`);
    return anchorOf(p, root);
  };
  const failures: string[] = [];
  for (const rule of rules) {
    const a = pos(rule.of);
    const b = pos(rule.than);
    const ok =
      rule.is === "above"
        ? a.y > b.y
        : rule.is === "below"
          ? a.y < b.y
          : rule.is === "leftOf"
            ? a.x < b.x
            : rule.is === "rightOf"
              ? a.x > b.x
              : rule.is === "inFrontOf"
                ? a.z > b.z
                : a.z < b.z;
    if (!ok) failures.push(`${rule.of} should be ${rule.is} ${rule.than}`);
  }
  return failures;
};

export type Axis = "width" | "height" | "depth";

/** Bounding size of a part, or of the whole model when name is `"model"`. */
const measure = (root: Group, parts: Record<string, Object3D>, name: string): Vector3 => {
  const target = name === "model" ? root : parts[name];
  if (!target) throw new Error(`proportion rule references unknown part "${name}"`);
  root.updateMatrixWorld(true);
  return new Box3().setFromObject(target).getSize(new Vector3());
};

const axisOf = (size: Vector3, axis: Axis): number =>
  axis === "width" ? size.x : axis === "height" ? size.y : size.z;

/**
 * "A stick is about a seventh of the body's width." Proportion knowledge about the object CLASS,
 * which nothing else checks: parts can be present, on the surface and correctly arranged, and
 * still be the wrong SIZE — a controller with dinner-plate buttons passes every other gate.
 */
export interface ProportionRule {
  what: string;
  measure: Axis;
  per: string;
  /** Defaults to the same axis as `measure` — set it to compare width against height, etc. */
  perMeasure?: Axis;
  range: [number, number];
  note?: string;
}

export const checkProportions = (
  root: Group,
  parts: Record<string, Object3D>,
  rules: ProportionRule[],
): string[] => {
  const failures: string[] = [];
  for (const rule of rules) {
    const a = axisOf(measure(root, parts, rule.what), rule.measure);
    const b = axisOf(measure(root, parts, rule.per), rule.perMeasure ?? rule.measure);
    if (b === 0) {
      failures.push(`${rule.per} has zero ${rule.perMeasure ?? rule.measure}`);
      continue;
    }
    const ratio = a / b;
    const [lo, hi] = rule.range;
    if (ratio < lo || ratio > hi) {
      failures.push(
        `${rule.what}.${rule.measure} ÷ ${rule.per}.${rule.perMeasure ?? rule.measure} = ` +
          `${ratio.toFixed(3)}, expected ${lo}–${hi}${rule.note ? ` (${rule.note})` : ""}`,
      );
    }
  }
  return failures;
};

/** Parts that must match in size — a pair of sticks, a pair of bumpers. */
export const checkSameSize = (
  root: Group,
  parts: Record<string, Object3D>,
  pairs: [string, string][],
  tolerance = 0.02,
): string[] => {
  const failures: string[] = [];
  for (const [a, b] of pairs) {
    const sa = measure(root, parts, a);
    const sb = measure(root, parts, b);
    const worst = Math.max(
      Math.abs(sa.x - sb.x) / Math.max(sa.x, sb.x),
      Math.abs(sa.y - sb.y) / Math.max(sa.y, sb.y),
      Math.abs(sa.z - sb.z) / Math.max(sa.z, sb.z),
    );
    if (worst > tolerance) {
      failures.push(`${a} and ${b} differ in size by ${(worst * 100).toFixed(1)}%`);
    }
  }
  return failures;
};

/**
 * What a KIND of object must have. Written per object class, so "a gamepad has four face buttons
 * in a diamond and two sticks" becomes an assertion instead of a hope.
 */
export interface PartsContract {
  /** Keys that must exist in the factory's `parts`. */
  required: string[];
  /** Relative-position rules over those parts. */
  layout?: LayoutRule[];
  /** Size relationships that define the class. */
  proportions?: ProportionRule[];
  /** Parts that must match each other in size. */
  sameSize?: [string, string][];
  /** Minimum distance between any two part anchors. */
  minSeparation?: number;
  /**
   * Axis the parts are mounted along, for the on-surface check. Defaults to +Z (a face plate).
   * Pass `null` for objects whose parts don't share one mounting face — a hinged laptop mounts
   * keys on the deck's top and the screen on a lid that swings, so a single axis is meaningless.
   */
  surfaceAxis?: [number, number, number] | null;
}

export interface ContractViolation {
  kind:
    | "missing"
    | "buried"
    | "floating"
    | "overlap"
    | "stray"
    | "layout"
    | "proportion"
    | "asymmetry";
  detail: string;
}

/** Run a contract against a built model. Empty array = the model keeps its promises. */
export const checkPartsContract = (
  root: Group,
  parts: Record<string, Object3D>,
  contract: PartsContract,
): ContractViolation[] => {
  const violations: ContractViolation[] = [];

  for (const name of contract.required) {
    if (!parts[name]) violations.push({ kind: "missing", detail: `part "${name}" is absent` });
  }
  const present = Object.fromEntries(
    Object.entries(parts).filter(([, p]) => p instanceof Object3D),
  );

  if (contract.surfaceAxis !== null) {
    const axis = new Vector3(...(contract.surfaceAxis ?? [0, 0, 1]));
    for (const r of checkPartsOnSurface(root, present, axis)) {
      if (r.buried)
        violations.push({ kind: "buried", detail: `"${r.part}" is inside the shell, not on it` });
      if (r.floating)
        violations.push({ kind: "floating", detail: `"${r.part}" has no body behind it` });
    }
  }
  for (const [a, b] of findOverlappingParts(root, present, contract.minSeparation ?? 0.05)) {
    violations.push({ kind: "overlap", detail: `"${a}" and "${b}" sit on the same spot` });
  }
  for (const name of findStrayParts(root, present)) {
    violations.push({ kind: "stray", detail: `"${name}" is outside the model's bounds` });
  }
  for (const failure of checkLayout(root, present, contract.layout ?? [])) {
    violations.push({ kind: "layout", detail: failure });
  }
  for (const failure of checkProportions(root, present, contract.proportions ?? [])) {
    violations.push({ kind: "proportion", detail: failure });
  }
  for (const failure of checkSameSize(root, present, contract.sameSize ?? [])) {
    violations.push({ kind: "asymmetry", detail: failure });
  }
  return violations;
};
