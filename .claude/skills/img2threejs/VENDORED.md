# Vendored — not our code

This directory is a verbatim copy of a third-party skill. Everything here except this file
comes from upstream.

```
Source:  https://github.com/hoainho/img2threejs
Pinned:  a2907eb5b0d00d6792150948f904eb901dc202c4  (2026-07-20)
License: MIT © hoainho — see LICENSE in this directory
Vendored on: 2026-07-20
```

## Why it's here

Second source of 3D models for the engine, alongside the Blender→GLB pipeline: it turns a
reference photo into a procedural TypeScript factory (`createXModel(): THREE.Group`) instead of a
binary mesh. See the engine-side integration in `src/models/` and the routing rule in
`.claude/skills/motion-promo/SKILL.md` (step 5a).

It lives under `.claude/skills/` rather than a `vendor/` folder so that `/img2threejs` actually
resolves as a skill — Claude Code only scans `.claude/skills/<name>/SKILL.md`.

## Rules

- **Do not hand-edit `forge/` or `grimoire/`.** Local fixes would be silently lost at the next
  re-vendor and make the pin a lie. Re-vendor at a newer pin instead, or keep engine-side
  adaptations in `src/models/`.
- Upstream has **no git tags** — "v1.2.0" is only a `SKILL.md` frontmatter field. Pin by SHA.
- Not copied from upstream: `assets/*.gif` (~11 MB of demo clips) and `.github/FUNDING.yml`.

## Re-vendoring

```bash
git clone https://github.com/hoainho/img2threejs.git /tmp/i2t && cd /tmp/i2t
git checkout <new-sha>
# copy forge/ grimoire/ SKILL.md LICENSE README.md ROADMAP.md docs/TOKEN_COST.md over this dir
python3 forge/tests/test_pipeline.py   # upstream's own suite — sanity-check the copy
# then update the pin above
```

`.claude/` is ignored by the global gitignore, so committing this requires an explicit
`git add -f .claude/skills/img2threejs/` — the same deliberate step `motion-promo` needed.

The engine toolchain never sees these files: `npm run lint` is `eslint src && tsc`,
`tsconfig.json` includes only `src`, and the determinism guard walks `src` — all scoped below
this directory.
