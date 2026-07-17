# Laptop v2: built ALREADY OPEN with all transforms applied (no runtime
# rotation needed), screen on the true inner face, plus a Blender-side
# preview render so the intended look is verifiable before export.
# Run: blender --background --python blender-laptop.py
import bpy
import math
import os

SCRATCH = os.path.dirname(os.path.abspath(__file__))

# ── clean scene ──
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()
for block in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras):
    for item in list(block):
        block.remove(item)


def metal(name, color, rough=0.4, met=0.6):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Metallic"].default_value = met
    b.inputs["Roughness"].default_value = rough
    return m


body_m = metal("Body", (0.05, 0.06, 0.085))
keys_m = metal("Keys", (0.02, 0.025, 0.036), rough=0.65, met=0.25)

screen_m = bpy.data.materials.new("Screen")
screen_m.use_nodes = True
sb = screen_m.node_tree.nodes["Principled BSDF"]
sb.inputs["Base Color"].default_value = (0.02, 0.02, 0.06, 1)
sb.inputs["Emission Color"].default_value = (0.486, 0.361, 1.0, 1)  # #7C5CFF
sb.inputs["Emission Strength"].default_value = 1.6

OPEN_DEG = 102  # lid angle from flat-closed

# ── deck (front edge toward -Y = camera side) ──
# NB: primitive cube size=1 → scale values are FULL dimensions (half = 0.5·scale)
bpy.ops.mesh.primitive_cube_add(size=1)
deck = bpy.context.object
deck.name = "Deck"
deck.scale = (3.2, 2.15, 0.09)
bev = deck.modifiers.new("bev", "BEVEL")
bev.width = 0.03
bev.segments = 5
deck.data.materials.append(body_m)

bpy.ops.mesh.primitive_cube_add(size=1)
kb = bpy.context.object
kb.name = "Keys"
kb.scale = (2.9, 1.44, 0.02)
kb.location = (0, 0.28, 0.055)
kbev = kb.modifiers.new("bev", "BEVEL")
kbev.width = 0.008
kbev.segments = 2
kb.data.materials.append(keys_m)

bpy.ops.mesh.primitive_cube_add(size=1)
tp = bpy.context.object
tp.name = "Trackpad"
tp.scale = (1.0, 0.54, 0.014)
tp.location = (0, -0.72, 0.055)
tp.data.materials.append(keys_m)

# ── lid: modeled OPEN in place (pure vector math, no parenting/apply) ──
# hinge line: y=+1.075 (back edge), z=+0.045 (deck top)
hy, hz = 1.075, 0.045
a = math.radians(OPEN_DEG)
# frame vectors in the Y-Z plane: u = hinge→far-edge, n = inner-face normal
uy, uz = -math.cos(a), math.sin(a)  # a=0 → lid lies flat toward the front
ny, nz = -math.sin(a), -math.cos(a)  # inner face: toward the user, slightly up

bpy.ops.mesh.primitive_cube_add(size=1)
lid = bpy.context.object
lid.name = "Lid"
lid.scale = (3.2, 2.15, 0.07)
lid.location = (0, hy + uy * 1.075, hz + uz * 1.075)
lid.rotation_euler[0] = -a  # -a aligns the slab's length axis with u
lbev = lid.modifiers.new("bev", "BEVEL")
lbev.width = 0.026
lbev.segments = 5
lid.data.materials.append(body_m)

# screen: thin emissive slab, offset from the lid center along the inner normal
bpy.ops.mesh.primitive_cube_add(size=1)
scr = bpy.context.object
scr.name = "ScreenFace"
scr.scale = (2.94, 1.88, 0.008)
scr.location = (0, hy + uy * 1.075 + ny * 0.04, hz + uz * 1.075 + nz * 0.04)
scr.rotation_euler[0] = -a
scr.data.materials.append(screen_m)

# ── Blender-side preview render (the ground truth) ──
bpy.ops.object.camera_add(location=(0, -7.2, 3.2), rotation=(math.radians(68), 0, 0))
cam = bpy.context.object
bpy.context.scene.camera = cam
bpy.ops.object.light_add(type="AREA", location=(3.5, -4, 5))
key_l = bpy.context.object
key_l.data.energy = 900
key_l.data.size = 6
bpy.ops.object.light_add(type="AREA", location=(-4, -2, 3))
fill_l = bpy.context.object
fill_l.data.energy = 350
fill_l.data.color = (0.55, 0.45, 1.0)
fill_l.data.size = 5

scene = bpy.context.scene
scene.render.resolution_x = 960
scene.render.resolution_y = 540
scene.render.filepath = os.path.join(SCRATCH, "blender-preview.png")
bpy.ops.render.render(write_still=True)
print("PREVIEW:", scene.render.filepath)

# side view — orthogonal truth-check of the hinge
bpy.ops.object.camera_add(location=(9, 0, 1.0), rotation=(math.radians(90), 0, math.radians(90)))
side_cam = bpy.context.object
bpy.context.scene.camera = side_cam
scene.render.filepath = os.path.join(SCRATCH, "blender-side.png")
bpy.ops.render.render(write_still=True)
print("SIDE:", scene.render.filepath)

# ── export (geometry only, no camera/lights) ──
for o in (cam, key_l, fill_l):
    o.select_set(True)
bpy.ops.object.select_all(action="DESELECT")
for name in ("Deck", "Keys", "Trackpad", "Lid", "ScreenFace"):
    bpy.data.objects[name].select_set(True)
out = r"C:\Users\pesto\Desktop\motion-engine\public\models\laptop.glb"
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_apply=True, use_selection=True)
print("EXPORTED:", out)
