import { Box3, DoubleSide, Mesh, Object3D, Quaternion, Raycaster, Vector3 } from "three";
import { inspectMesh } from "./meshHealth";
import { FACE_NORMAL, OBJECT_CLASSES } from "./knowledge/objectClasses";
import { checkDepthProfile } from "./depthProfile";
import { checkWaist } from "./formLandmarks";
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

// ── orientation ─────────────────────────────────────────────────────────

const DIRECTIONS = {
  up: new Vector3(0, 1, 0),
  down: new Vector3(0, -1, 0),
  left: new Vector3(-1, 0, 0),
  right: new Vector3(1, 0, 0),
  /** Toward the viewer. */
  forward: new Vector3(0, 0, 1),
  back: new Vector3(0, 0, -1),
} as const;

/**
 * "The screen faces the viewer." "The glyph faces out of the button."
 *
 * Position and size say nothing about FACING: a part mounted backwards keeps its bounding-box
 * centre and its dimensions exactly, so every other check in this file passes it. That is the same
 * defect shape as an inside-out shell — technically valid, visually broken — and until now the
 * layer built to catch that class could not see it.
 */
export interface OrientationRule {
  of: string;
  /** Which of the part's own axes to test. Defaults to +Z, the face direction by convention. */
  localAxis?: [number, number, number];
  points: keyof typeof DIRECTIONS;
  /** Cosine floor. 0.5 ≈ within 60°; raise it to demand a tighter alignment. */
  minDot?: number;
}

export const checkOrientation = (
  root: Group,
  parts: Record<string, Object3D>,
  rules: OrientationRule[],
): string[] => {
  root.updateMatrixWorld(true);
  const failures: string[] = [];
  const quaternion = new Quaternion();
  for (const rule of rules) {
    const part = parts[rule.of];
    if (!part) {
      failures.push(`orientation rule references unknown part "${rule.of}"`);
      continue;
    }
    const axis = new Vector3(...(rule.localAxis ?? [0, 0, 1])).normalize();
    part.getWorldQuaternion(quaternion);
    const world = axis.clone().applyQuaternion(quaternion);
    const want = DIRECTIONS[rule.points];
    const dot = world.dot(want);
    const min = rule.minDot ?? 0.5;
    if (dot < min) {
      failures.push(
        `${rule.of} should face ${rule.points} but its axis points ` +
          `(${world.x.toFixed(2)}, ${world.y.toFixed(2)}, ${world.z.toFixed(2)}) — dot ${dot.toFixed(2)} < ${min}`,
      );
    }
  }
  return failures;
};

/**
 * Is the model's SHELL built outward?
 *
 * Independent of `checkPartsOnSurface` on purpose. That function flips shell materials to
 * DoubleSide for the duration of its raycast — necessary, or FrontSide culling would hide a buried
 * part — but the side effect is that it cannot perceive which way the shell's own faces point.
 * The layer written in response to an inside-out shell was structurally blind to inside-out
 * shells. This closes that, reusing the signed-volume test from meshHealth.
 *
 * Only closed meshes are judged: a flat ShapeGeometry screen or an uncapped loft has no meaningful
 * enclosed volume, so anything with boundary edges is skipped rather than failed.
 */
export const checkShellOutward = (root: Group): string[] => {
  // EVERY closed mesh, parts included. An earlier version excluded declared parts — which meant
  // the phone, whose body IS a declared part, had its shell skipped by the check written for
  // inside-out shells. "Faces the right way" applies to any solid, whatever role it plays.
  const meshes: Mesh[] = [];
  root.traverse((o) => {
    if (o instanceof Mesh) meshes.push(o);
  });
  const failures: string[] = [];
  for (const mesh of meshes) {
    const report = inspectMesh(mesh.geometry);
    if (report.boundaryEdges > 0) continue; // open by design — nothing to say about its volume
    if (report.signedVolume <= 0) {
      failures.push(
        `"${mesh.name || "(unnamed mesh)"}" is inside-out (signed volume ` +
          `${report.signedVolume.toFixed(4)}) — with FrontSide materials its faces will vanish`,
      );
    }
  }
  return failures;
};

/**
 * What a KIND of object must have. Written per object class, so "a gamepad has four face buttons
 * in a diamond and two sticks" becomes an assertion instead of a hope.
 */
export interface PartsContract {
  /**
   * Object class this model claims to be. When set, the class's `requiredParts` are asserted too —
   * counts AND which face each sits on. That is knowledge the model being checked does not supply,
   * which is the point: `required` below lists what the author remembered, and the author is
   * exactly who forgot the triggers.
   */
  classId?: string;
  /** Keys that must exist in the factory's `parts`. */
  required: string[];
  /**
   * Parts the class requires that this model deliberately does not build, each with a reason.
   *
   * A written waiver is weaker than it looks and is not treated as proof of anything: the same
   * author writes the geometry and the excuse, and the excuse that produced this whole mess —
   * "not visible in the reference" — was fluent, plausible, and false (the reference views were on
   * disk the whole time). The reason is recorded so review has something to argue with, not so CI
   * can be satisfied. Waivers surface as warnings; they never silently vanish.
   */
  omittedParts?: { name: string; reason: string }[];
  /** Relative-position rules over those parts. */
  layout?: LayoutRule[];
  /** Size relationships that define the class. */
  proportions?: ProportionRule[];
  /** Parts that must match each other in size. */
  sameSize?: [string, string][];
  /** Which way parts must face — position and size cannot express this. */
  orientation?: OrientationRule[];
  /** Verify the shell itself is built outward. Defaults to on. */
  checkShell?: boolean;
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
    | "under-count"
    | "wrong-face"
    | "depth"
    | "form"
    | "waived"
    | "buried"
    | "floating"
    | "overlap"
    | "stray"
    | "layout"
    | "proportion"
    | "asymmetry"
    | "orientation"
    | "inside-out";
  detail: string;
  /**
   * Whether this must block. Class entries at `status: "drafted"` warn instead of failing — the
   * gamepad's 28 mm housing depth is recalled, not published, and blocking CI on a half-remembered
   * number teaches people to delete the classId rather than fix the model.
   */
  severity: "error" | "warning";
}

/**
 * Assert the class's required parts: how many, and on which face.
 *
 * The face test is geometric, not decorative. Asserting only a count is satisfied by two cubes
 * named triggerLeft/triggerRight sitting anywhere at all — including inside the shell — so the
 * anchor must actually lie toward the named face, measured against the model's own bounds.
 */
export const checkRequiredParts = (
  root: Group,
  parts: Record<string, Object3D>,
  classId: string,
  omitted: { name: string; reason: string }[] = [],
): ContractViolation[] => {
  const cls = OBJECT_CLASSES[classId];
  if (!cls) {
    return [
      {
        kind: "missing",
        severity: "warning",
        detail: `no class entry for "${classId}" — add one to src/models/knowledge/objectClasses.ts`,
      },
    ];
  }
  const severity: "error" | "warning" = cls.status === "sourced" ? "error" : "warning";
  const violations: ContractViolation[] = [];
  const bounds = new Box3().setFromObject(root);
  const centre = bounds.getCenter(new Vector3());
  const half = bounds.getSize(new Vector3()).multiplyScalar(0.5);

  for (const rp of cls.requiredParts ?? []) {
    const waiver = omitted.find((o) => o.name === rp.name);
    if (waiver) {
      violations.push({
        kind: "waived",
        severity: "warning",
        detail:
          `class "${classId}" requires ${rp.count} × ${rp.name} on the ${rp.face} face; this ` +
          `model omits it — "${waiver.reason}". Source: ${rp.prov.source}`,
      });
      continue;
    }
    const matched = Object.entries(parts)
      .filter(([k, v]) => v instanceof Object3D && new RegExp(rp.partsKey).test(k))
      .map(([, v]) => v);

    if (matched.length !== rp.count) {
      violations.push({
        kind: "under-count",
        severity,
        detail:
          `class "${classId}" requires ${rp.count} × ${rp.name} on the ${rp.face} face ` +
          `(${rp.prov.confidence}, ${rp.prov.source}${rp.prov.quote ? `: "${rp.prov.quote}"` : ""}); ` +
          `model exposes ${matched.length} matching /${rp.partsKey}/ and declares no omission`,
      });
      continue;
    }

    // Face membership: the anchor's offset from the model centre, along the face's outward normal,
    // normalised by the half-extent on that axis. A part genuinely mounted on a face sits well
    // past the middle; 0.45 leaves room for a recessed part without admitting one on the far side.
    const normal = new Vector3(...FACE_NORMAL[rp.face]);
    for (const obj of matched) {
      const anchor = obj.getWorldPosition(new Vector3()).sub(centre);
      const reach = Math.abs(normal.x) * half.x + Math.abs(normal.y) * half.y + Math.abs(normal.z) * half.z;
      const along = reach < 1e-6 ? 0 : anchor.dot(normal) / reach;
      if (along < 0.45) {
        violations.push({
          kind: "wrong-face",
          severity,
          detail:
            `"${obj.name || rp.name}" should sit on the ${rp.face} face, but its anchor reaches ` +
            `only ${along.toFixed(2)} of the way there (need 0.45) — a count assertion alone is ` +
            `satisfied by a part bolted on anywhere`,
        });
      }
    }
  }
  return violations;
};

/** Run a contract against a built model. Empty array = the model keeps its promises. */
export const checkPartsContract = (
  root: Group,
  parts: Record<string, Object3D>,
  contract: PartsContract,
): ContractViolation[] => {
  const violations: ContractViolation[] = [];

  for (const name of contract.required) {
    if (!parts[name])
      violations.push({ kind: "missing", severity: "error", detail: `part "${name}" is absent` });
  }
  const present = Object.fromEntries(
    Object.entries(parts).filter(([, p]) => p instanceof Object3D),
  );

  if (contract.classId) {
    violations.push(
      ...checkRequiredParts(root, present, contract.classId, contract.omittedParts),
    );
    const cls = OBJECT_CLASSES[contract.classId];
    if (cls?.depthProfile) violations.push(...checkDepthProfile(root, cls.depthProfile));
    if (cls?.waist) {
      const severity = cls.status === "sourced" ? "error" : "warning";
      violations.push(...checkWaist(root, cls.waist, severity));
    }
  }

  if (contract.surfaceAxis !== null) {
    // Each part is raycast along the face IT is mounted on, not along one axis for the whole
    // model. A single axis is wrong the moment an object has parts on more than one face: adding
    // top-face triggers to a model checked along +Z reports them "floating" — no body behind them
    // — and the only escape would be surfaceAxis: null, disabling the buried/floating check
    // entirely. Fixing one gate by switching another off is not a fix.
    const fallback = (contract.surfaceAxis ?? [0, 0, 1]) as [number, number, number];
    const axisFor: Record<string, [number, number, number]> = {};
    const recessed = new Set<string>();
    for (const rp of OBJECT_CLASSES[contract.classId ?? ""]?.requiredParts ?? []) {
      for (const key of Object.keys(present)) {
        if (!new RegExp(rp.partsKey).test(key)) continue;
        axisFor[key] = FACE_NORMAL[rp.face];
        if (rp.seat === "recessed") recessed.add(key);
      }
    }
    const groups = new Map<string, Record<string, Object3D>>();
    for (const [key, obj] of Object.entries(present)) {
      const axis = axisFor[key] ?? fallback;
      const id = axis.join(",");
      groups.set(id, { ...(groups.get(id) ?? {}), [key]: obj });
    }
    for (const [id, group] of groups) {
      const axis = new Vector3(...(id.split(",").map(Number) as [number, number, number]));
      for (const r of checkPartsOnSurface(root, group, axis)) {
        // The two seats invert each other, and BOTH of the raw signals had to be reinterpreted.
        // A proud part must have nothing outward of it and body close behind. A recessed part is
        // the mirror image: shell above it is the proof it sits in a pocket, and "body close
        // behind" is meaningless, because a ray fired inward from inside the shell next meets the
        // far wall a whole object away. Applying the proud rules to a correctly-recessed bumper
        // reported it both buried AND floating at once — a contradiction that is really the check
        // saying it has no vocabulary for this part.
        if (recessed.has(r.part)) {
          if (!r.buried)
            violations.push({
              kind: "floating",
              severity: "error",
              detail:
                `"${r.part}" is declared recessed but has no shell over it — it sits on top of ` +
                `the body rather than set into it (checked along ${id})`,
            });
          continue;
        }
        if (r.buried)
          violations.push({
            kind: "buried",
            severity: "error",
            detail: `"${r.part}" is inside the shell, not on it`,
          });
        if (r.floating)
          violations.push({
            kind: "floating",
            severity: "error",
            detail: `"${r.part}" has no body behind it (checked along ${id})`,
          });
      }
    }
  }
  for (const [a, b] of findOverlappingParts(root, present, contract.minSeparation ?? 0.05)) {
    violations.push({ kind: "overlap", severity: "error", detail: `"${a}" and "${b}" sit on the same spot` });
  }
  for (const name of findStrayParts(root, present)) {
    violations.push({ kind: "stray", severity: "error", detail: `"${name}" is outside the model's bounds` });
  }
  for (const failure of checkLayout(root, present, contract.layout ?? [])) {
    violations.push({ kind: "layout", severity: "error", detail: failure });
  }
  for (const failure of checkProportions(root, present, contract.proportions ?? [])) {
    violations.push({ kind: "proportion", severity: "error", detail: failure });
  }
  for (const failure of checkSameSize(root, present, contract.sameSize ?? [])) {
    violations.push({ kind: "asymmetry", severity: "error", detail: failure });
  }
  for (const failure of checkOrientation(root, present, contract.orientation ?? [])) {
    violations.push({ kind: "orientation", severity: "error", detail: failure });
  }
  if (contract.checkShell !== false) {
    for (const failure of checkShellOutward(root)) {
      violations.push({ kind: "inside-out", severity: "error", detail: failure });
    }
  }
  return violations;
};
