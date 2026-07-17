# Hinged laptop for runtime lid animation: exported CLOSED, «Lid» node has
# its origin ON the hinge line and «ScreenFace» is its child — rotate
# Lid.rotation.x at runtime to open. Also renders closed-front and
# open-side previews as ground truth.
# Run: blender --background --python laptop-hinged.py
import bpy
import math
import os

OUT_GLB = r"C:\Users\pesto\Desktop\motion-engine\public\models\laptop-hinged.glb"
PREVIEW_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "out", "three")

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
sb.inputs["Base Color"].default_value = (0.01, 0.01, 0.02, 1)
# the actual desktop still is baked in as the emissive map — the intro
# dolly lands on the exact image the 2D flow starts with (match-cut)
img = bpy.data.images.load(r"C:\Users\pesto\Desktop\motion-engine\public\shotik\desktop-still.png")
texn = screen_m.node_tree.nodes.new("ShaderNodeTexImage")
texn.image = img
screen_m.node_tree.links.new(texn.outputs["Color"], sb.inputs["Emission Color"])
sb.inputs["Emission Strength"].default_value = 1.4

# ── deck (cube size=1 → scale = FULL dims) ──
bpy.ops.mesh.primitive_cube_add(size=1)
deck = bpy.context.object
deck.name = "Deck"
deck.scale = (3.2, 2.15, 0.09)
bev = deck.modifiers.new("bev", "BEVEL")
bev.width = 0.03
bev.segments = 5
deck.data.materials.append(body_m)

# ── keyboard: dark base plate + a grid of individual keycaps (joined) ──
bpy.ops.mesh.primitive_cube_add(size=1)
kbase = bpy.context.object
kbase.name = "KeyBase"
kbase.scale = (2.98, 1.52, 0.014)
kbase.location = (0, 0.28, 0.05)
kbase.data.materials.append(keys_m)

keycap_m = metal("Keycap", (0.032, 0.037, 0.055), rough=0.72, met=0.2)
KB_TOP = 0.057  # top surface of the base plate
AREA_W, AREA_D = 2.84, 1.42
KB_CX, KB_CY = 0.0, 0.28
GAP = 0.026
kh = 0.022
# realistic per-row layout, BACK (function row, by the hinge) → FRONT (spacebar,
# by the user). Widths are in key-units "u" (1u = a letter key); wider keys are
# Tab/Caps/Shift/Enter/Backspace/modifiers, and the function row is shorter.
LAYOUT = [
    {"h": 0.66, "keys": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]},   # Esc + F1–F12
    {"h": 1.0, "keys": [1] * 13 + [1.9]},                           # ` 1…0 - =  ⌫
    {"h": 1.0, "keys": [1.5] + [1] * 12 + [1.4]},                   # ⇥ q…]  \
    {"h": 1.0, "keys": [1.8] + [1] * 11 + [2.1]},                   # ⇪ a…'  ⏎
    {"h": 1.0, "keys": [2.3] + [1] * 10 + [2.6]},                   # ⇧ z…/  ⇧
    {"h": 1.0, "keys": [1.3, 1.3, 1.3, 6.4, 1.3, 1.3, 1.3]},        # ctrl win alt ␣ alt fn ctrl
]
h_total = sum(r["h"] for r in LAYOUT)
row_d_u = (AREA_D - GAP * len(LAYOUT)) / h_total
y_back = KB_CY + AREA_D / 2
caps = []
for row in LAYOUT:
    rd = row["h"] * row_d_u
    cy = y_back - rd / 2
    y_back -= rd + GAP
    units = sum(row["keys"])
    n = len(row["keys"])
    w_u = (AREA_W - GAP * n) / units
    x = KB_CX - AREA_W / 2 + GAP / 2
    for ku in row["keys"]:
        kw = ku * w_u
        bpy.ops.mesh.primitive_cube_add(size=1)
        k = bpy.context.object
        k.scale = (kw, rd, kh)
        k.location = (x + kw / 2, cy, KB_TOP + kh / 2)
        k.data.materials.append(keycap_m)
        caps.append(k)
        x += kw + GAP
# join all keycaps into ONE "Keys" mesh (keeps the export list stable), bevel once
bpy.ops.object.select_all(action="DESELECT")
for k in caps:
    k.select_set(True)
bpy.context.view_layer.objects.active = caps[0]
bpy.ops.object.join()
keys = bpy.context.object
keys.name = "Keys"
kcbev = keys.modifiers.new("b", "BEVEL")
kcbev.width = 0.006
kcbev.segments = 2

bpy.ops.mesh.primitive_cube_add(size=1)
tp = bpy.context.object
tp.name = "Trackpad"
tp.scale = (1.0, 0.54, 0.014)
tp.location = (0, -0.72, 0.055)
tp.data.materials.append(keys_m)

# ── rubber feet (4) under the deck ──
foot_m = metal("Foot", (0.008, 0.008, 0.012), rough=0.92, met=0.0)
feet = []
for fx, fy in ((-1.36, 0.86), (1.36, 0.86), (-1.36, -0.86), (1.36, -0.86)):
    bpy.ops.mesh.primitive_cube_add(size=1)
    ft = bpy.context.object
    ft.scale = (0.22, 0.22, 0.02)
    ft.location = (fx, fy, -0.052)
    ft.data.materials.append(foot_m)
    feet.append(ft)
bpy.ops.object.select_all(action="DESELECT")
for ft in feet:
    ft.select_set(True)
bpy.context.view_layer.objects.active = feet[0]
bpy.ops.object.join()
bpy.context.object.name = "Feet"

# ── hinge barrel along the back edge (static — not parented to the lid) ──
hinge_m = metal("HingeMetal", (0.03, 0.035, 0.05), rough=0.35, met=0.85)
bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=2.5, location=(0, 1.075, 0.05), rotation=(0, math.radians(90), 0))
hinge = bpy.context.object
hinge.name = "Hinge"
hinge.data.materials.append(hinge_m)

# ── lid, CLOSED over the deck; origin moved onto the hinge line ──
bpy.ops.mesh.primitive_cube_add(size=1)
lid = bpy.context.object
lid.name = "Lid"
lid.scale = (3.2, 2.15, 0.07)
lid.location = (0, 0, 0.08)  # bottom at deck top (0.045)
lbev = lid.modifiers.new("bev", "BEVEL")
lbev.width = 0.026
lbev.segments = 5
lid.data.materials.append(body_m)
# origin → hinge (back edge of the deck top) BEFORE parenting the screen
bpy.context.scene.cursor.location = (0, 1.075, 0.045)
bpy.ops.object.select_all(action="DESELECT")
lid.select_set(True)
bpy.context.view_layer.objects.active = lid
bpy.ops.object.origin_set(type="ORIGIN_CURSOR")

# ── screen: textured PLANE (clean 0-1 UVs) on the lid's inner face ──
bpy.ops.mesh.primitive_plane_add(size=1)
scr = bpy.context.object
scr.name = "ScreenFace"
scr.scale = (2.94, 1.88, 1)
scr.rotation_euler = (math.radians(180), 0, 0)  # face DOWN when closed
scr.location = (0, -0.09, 0.043)
scr.data.materials.append(screen_m)
scr.parent = lid
scr.matrix_parent_inverse = lid.matrix_world.inverted()

# ── previews ──
os.makedirs(PREVIEW_DIR, exist_ok=True)
bpy.ops.object.camera_add(location=(0, -7.2, 3.2), rotation=(math.radians(68), 0, 0))
cam = bpy.context.object
bpy.context.scene.camera = cam
bpy.ops.object.light_add(type="AREA", location=(3.5, -4, 5))
l1 = bpy.context.object
l1.data.energy = 900
l1.data.size = 6
bpy.ops.object.light_add(type="AREA", location=(-4, -2, 3))
l2 = bpy.context.object
l2.data.energy = 350
l2.data.color = (0.55, 0.45, 1.0)
l2.data.size = 5

scene = bpy.context.scene
scene.render.resolution_x = 960
scene.render.resolution_y = 540

# open-front preview WITH texture — verifies screen image orientation
lid.rotation_euler[0] = math.radians(-102)
scene.render.filepath = os.path.join(PREVIEW_DIR, "hinged-open-front.png")
bpy.ops.render.render(write_still=True)
bpy.ops.object.camera_add(location=(9, 0, 1.0), rotation=(math.radians(90), 0, math.radians(90)))
side = bpy.context.object
bpy.context.scene.camera = side
scene.render.filepath = os.path.join(PREVIEW_DIR, "hinged-open-side.png")
bpy.ops.render.render(write_still=True)
lid.rotation_euler[0] = 0  # export CLOSED

# ── export geometry only ──
bpy.ops.object.select_all(action="DESELECT")
for name in ("Deck", "KeyBase", "Keys", "Trackpad", "Feet", "Hinge", "Lid", "ScreenFace"):
    bpy.data.objects[name].select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format="GLB", export_apply=True, use_selection=True)
print("EXPORTED:", OUT_GLB)
