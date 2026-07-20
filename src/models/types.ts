import type { Group, Material, Object3D } from "three";

/**
 * What every procedural model factory in `src/models/` returns.
 *
 * `group` is what a rig mounts via `<primitive object={handles.group} />`.
 * `parts` are the SAME object references the factory captured while building
 * that group — never the result of a lookup.
 *
 * WHY THAT MATTERS (footgun #7): `<primitive>` physically reparents the object
 * out of its original tree, so `scene.getObjectByName("Lid")` returns undefined
 * from frame 2 on in a sequential render — and stills never catch it, because a
 * still is always a fresh mount. BybitGif.tsx works around this by resolving
 * nodes once in a useMemo; a factory gets the same guarantee for free, because a
 * JS reference survives reparenting (it changes `.parent`, not the object) and
 * the idiomatic API here has no string interface to misuse in the first place.
 *
 * Consumers should still build the model once (`useMemo(() => createXModel(), [])`)
 * and then mutate `parts` per frame, the way Laptop3DIntro mutates the GLB's
 * screen material today.
 */
export interface ModelHandles<Parts extends Record<string, Object3D | Material>> {
  group: Group;
  parts: Parts;
}

/**
 * Deterministic PRNG for procedural jitter (panel gaps, wear, scatter).
 *
 * Hard rule #1 bans `Math.random()` outright — it breaks the Δ=0 invariant and
 * the determinism guard greps for it. Seed with a fixed constant, never a clock.
 */
export const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
