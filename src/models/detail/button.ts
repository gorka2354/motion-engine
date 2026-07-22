import { Group, Mesh } from "three";
import type { BufferGeometry, MeshStandardMaterial } from "three";
import { CAP_TOP, lathedCap } from "./cap";

/**
 * A button: a lathed cap plus an optional printed legend flush on its dished top.
 *
 * Returns a NAMED Group so the part-count and on-surface gates still see one proud control per
 * mount point — the same guarantee the remote's inline version gave, now shared with the gamepad.
 * The legend is a separate mesh with its own (lit, never emissive) material, sunk into the dish so
 * its own extrusion depth leaves it half-proud, reading as printed.
 */
export interface ButtonSpec {
  radius: number;
  /** Cap height; defaults to half the radius — a shallow moulded button. */
  capHeight?: number;
  capMaterial: MeshStandardMaterial;
  /** Extruded legend geometry (a digit from text.ts, a glyph from glyphs.ts), already sized/centred. */
  legend?: BufferGeometry;
  legendMaterial?: MeshStandardMaterial;
}

export const button = (name: string, spec: ButtonSpec): Group => {
  const g = new Group();
  g.name = name;
  const h = spec.capHeight ?? spec.radius * 0.5;
  g.add(new Mesh(lathedCap(spec.radius, h), spec.capMaterial));
  if (spec.legend && spec.legendMaterial) {
    const legend = new Mesh(spec.legend, spec.legendMaterial);
    legend.position.z = h * CAP_TOP;
    g.add(legend);
  }
  return g;
};
