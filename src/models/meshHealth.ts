import { BufferGeometry, Vector3 } from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Topological health of a procedurally built mesh.
 *
 * WHY THIS EXISTS. A shell can be perfectly valid geometry and still be visibly broken, and the
 * failure mode is nastier than it sounds: with FrontSide materials an inside-out face doesn't look
 * wrong, it looks ABSENT — the backdrop shows through and it reads as a missing face rather than a
 * winding bug. That is exactly how the lofted phone body shipped, and it was caught by eye.
 *
 * Two checks are needed, not one, and they catch different things:
 *   - winding consistency is LOCAL — it finds a single flipped patch inside an otherwise correct
 *     shell, which a volume test averages away;
 *   - signed volume is GLOBAL — it finds a shell that is uniformly inside-out, which the local
 *     test cannot see because every edge is still consistent with its neighbour.
 *
 * Order matters. Procedural seams almost never produce bit-identical vertices (accumulated float
 * error from loft/extrude maths), so an exact-match edge hash sees two "different" vertices at
 * every seam and reports the whole seam as a hole. Welding first is not an optimisation, it is a
 * correctness precondition.
 *
 * Scope: meshes that are meant to be CLOSED. Open geometry (a ShapeGeometry screen, a plane, a
 * loft built with `caps: false`) legitimately has boundary edges — run `inspectMesh` on those for
 * information, but don't assert closedness.
 */

export interface MeshHealthReport {
  triangles: number;
  vertices: number;
  /** Vertices collapsed by welding — high counts mean the seams were not shared. */
  welded: number;
  /** Edges used by exactly one triangle: holes in a shell meant to be closed. */
  boundaryEdges: number;
  /** Edges shared by 3+ triangles: a genuine topology fault, not just a gap. */
  nonManifoldEdges: number;
  /** Edge pairs traversed the SAME way by both triangles: a locally flipped patch. */
  inconsistentEdges: number;
  /** Positive when the surface faces outward, negative when the shell is inside-out. */
  signedVolume: number;
  /** Zero-area triangles: produce NaN normals and z-fighting. */
  degenerateTriangles: number;
}

const EPSILON_AREA = 1e-10;

/**
 * Measure a geometry. Non-destructive: welding happens on a clone.
 *
 * @param tolerance vertex-welding distance. Default matches three's own mergeVertices default.
 */
export const inspectMesh = (geo: BufferGeometry, tolerance = 1e-4): MeshHealthReport => {
  const before = geo.getAttribute("position").count;

  // Weld on POSITION ALONE. three's mergeVertices hashes every attribute, so two vertices at the
  // identical point but with different normals or UVs — which is exactly what ExtrudeGeometry
  // produces where a cap meets a side wall — never merge. Topologically the shell is closed;
  // attribute-aware welding just can't see it. Measured: a laptop deck reported 1080 "holes"
  // before this, and 0 after.
  const positions = new BufferGeometry();
  positions.setAttribute("position", geo.getAttribute("position").clone());
  if (geo.getIndex()) positions.setIndex(geo.getIndex()!.clone());
  const welded = mergeVertices(positions, tolerance);
  const pos = welded.getAttribute("position");
  const index = welded.getIndex();
  if (!index) {
    throw new Error("inspectMesh: geometry has no index after welding — cannot analyse topology");
  }

  const triangles = index.count / 3;
  /** edge key → [useCount, netDirection] */
  const edges = new Map<string, [number, number]>();
  let degenerate = 0;
  let volume = 0;

  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  const ab = new Vector3();
  const ac = new Vector3();
  const cross = new Vector3();

  for (let t = 0; t < index.count; t += 3) {
    const i0 = index.getX(t);
    const i1 = index.getX(t + 1);
    const i2 = index.getX(t + 2);

    a.fromBufferAttribute(pos, i0);
    b.fromBufferAttribute(pos, i1);
    c.fromBufferAttribute(pos, i2);

    // signed tetrahedron volume from the origin; summed over a closed surface this is the
    // enclosed volume, and its SIGN is the global orientation
    cross.copy(b).cross(c);
    volume += a.dot(cross) / 6;

    ab.copy(b).sub(a);
    ac.copy(c).sub(a);
    if (ab.cross(ac).lengthSq() < EPSILON_AREA) degenerate++;

    for (const [x, y] of [
      [i0, i1],
      [i1, i2],
      [i2, i0],
    ]) {
      // key is direction-agnostic; direction is tracked separately so that two triangles
      // traversing the same edge the SAME way (a winding fault) is distinguishable from the
      // normal case, where they traverse it in opposite directions
      const key = x < y ? `${x}_${y}` : `${y}_${x}`;
      const dir = x < y ? 1 : -1;
      const hit = edges.get(key);
      if (hit) {
        hit[0]++;
        hit[1] += dir;
      } else {
        edges.set(key, [1, dir]);
      }
    }
  }

  let boundaryEdges = 0;
  let nonManifoldEdges = 0;
  let inconsistentEdges = 0;
  for (const [count, direction] of edges.values()) {
    if (count === 1) boundaryEdges++;
    else if (count > 2) nonManifoldEdges++;
    // two triangles, both walking the edge the same way ⇒ |sum| === 2 instead of 0
    else if (Math.abs(direction) === 2) inconsistentEdges++;
  }

  return {
    triangles,
    vertices: pos.count,
    welded: before - pos.count,
    boundaryEdges,
    nonManifoldEdges,
    inconsistentEdges,
    signedVolume: volume,
    degenerateTriangles: degenerate,
  };
};

export interface ClosedShellOptions {
  tolerance?: number;
  /** Allow this many boundary edges before complaining (0 for a truly closed shell). */
  maxBoundaryEdges?: number;
  /** Allow degenerate triangles — some primitives legitimately produce a few at poles. */
  maxDegenerate?: number;
}

/**
 * Assert a mesh is a closed, outward-facing shell. Returns human-readable problems; empty means
 * healthy. Written to return rather than throw so a test can assert on the list and a script can
 * print it.
 */
export const checkClosedShell = (
  geo: BufferGeometry,
  options: ClosedShellOptions = {},
): string[] => {
  const { tolerance = 1e-4, maxBoundaryEdges = 0, maxDegenerate = 0 } = options;
  const r = inspectMesh(geo, tolerance);
  const problems: string[] = [];

  if (r.boundaryEdges > maxBoundaryEdges) {
    problems.push(
      `${r.boundaryEdges} boundary edge(s) — the shell has a hole (expected ≤ ${maxBoundaryEdges})`,
    );
  }
  if (r.nonManifoldEdges > 0) {
    problems.push(`${r.nonManifoldEdges} non-manifold edge(s) — 3+ faces share an edge`);
  }
  if (r.inconsistentEdges > 0) {
    problems.push(
      `${r.inconsistentEdges} edge(s) with inconsistent winding — a patch of faces is flipped`,
    );
  }
  if (r.signedVolume <= 0) {
    problems.push(
      `signed volume ${r.signedVolume.toFixed(4)} ≤ 0 — the shell is inside-out ` +
        `(with FrontSide materials its faces will simply vanish)`,
    );
  }
  if (r.degenerateTriangles > maxDegenerate) {
    problems.push(
      `${r.degenerateTriangles} degenerate triangle(s) — zero area, produces NaN normals ` +
        `(expected ≤ ${maxDegenerate})`,
    );
  }
  return problems;
};
