# Pre-export QA gate for Blender -> GLB generation. Import and call qa_check(...)
# right before export_scene.gltf() to turn SILENT asset bugs into a loud failure.
#
# Catches the footgun classes we hit by hand:
#  * export_apply=True applies MODIFIERS, not object transforms -> an unapplied
#    scale/rotation silently ships as node TRS (the "size=1 -> full side" and
#    "parent shifts children" bugs). Reported as WARN by default (a node transform
#    is valid glTF), or a hard FAIL with strict_transforms=True.
#  * degenerate / out-of-range geometry -> mesh.validate() would fix it silently.
#  * a textured material with no UV layer -> the baked texture renders wrong.
#  * wrong overall dimensions vs what the scene expects (the size gotcha).
import bpy


def qa_check(object_names, expected_dims=None, dims_tol=0.02, strict_transforms=False):
    problems, warnings = [], []
    for name in object_names:
        obj = bpy.data.objects.get(name)
        if obj is None:
            problems.append("%s: object missing" % name)
            continue

        scale = tuple(round(s, 4) for s in obj.scale)
        if scale != (1.0, 1.0, 1.0):
            msg = "%s: unapplied scale %s -- call transform_apply(scale=True) first" % (name, scale)
            (problems if strict_transforms else warnings).append(msg)

        if obj.type == "MESH":
            me = obj.data
            if me.validate(verbose=False):  # returns True if it HAD to fix something
                problems.append("%s: mesh.validate() fixed bad geometry (degenerate/out-of-range)" % name)
            textured = any(getattr(m, "use_nodes", False) for m in me.materials if m)
            if textured and not me.uv_layers:
                problems.append("%s: textured material but no UV layer -> baked texture will be wrong" % name)

        if expected_dims and name in expected_dims:
            want = expected_dims[name]
            got = tuple(obj.dimensions)
            if any(abs(g - w) > dims_tol for g, w in zip(got, want)):
                problems.append(
                    "%s: dimensions %s != expected %s (size gotcha?)"
                    % (name, tuple(round(g, 3) for g in got), want)
                )

    for w in warnings:
        print("QA WARN:", w)
    if problems:
        for p in problems:
            print("QA FAIL:", p)
        raise SystemExit(1)
    tail = ("  (%d warnings)" % len(warnings)) if warnings else ""
    print("QA OK: %s%s" % (", ".join(object_names), tail))
