# Bybit credit card: rounded-rect body (vertex bevel + solidify) with the
# React-rendered face baked as an emissive alpha texture.
# Run: blender --background --python bybit-card.py
import bpy
import math
import os

OUT_GLB = r"C:\Users\pesto\Desktop\motion-engine\public\models\bybit-card.glb"
FACE_PNG = r"C:\Users\pesto\Desktop\motion-engine\public\bybit\card-face.png"
PREVIEW_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "out", "bybit")

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()
for block in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras, bpy.data.images):
    for item in list(block):
        try:
            block.remove(item)
        except Exception:
            pass

# ── body: plane → vertex bevel (rounded corners) → solidify ──
bpy.ops.mesh.primitive_plane_add(size=1)
card = bpy.context.object
card.name = "CardBody"
card.scale = (3.42, 2.16, 1)
bpy.ops.object.transform_apply(scale=True)
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.bevel(offset=0.13, segments=10, affect="VERTICES")
bpy.ops.object.mode_set(mode="OBJECT")
sol = card.modifiers.new("sol", "SOLIDIFY")
sol.thickness = 0.055
sol.offset = 0

body_m = bpy.data.materials.new("Body")
body_m.use_nodes = True
bb = body_m.node_tree.nodes["Principled BSDF"]
bb.inputs["Base Color"].default_value = (0.03, 0.031, 0.038, 1)
bb.inputs["Metallic"].default_value = 0.65
bb.inputs["Roughness"].default_value = 0.38
card.data.materials.append(body_m)

# ── face plane with the React-rendered texture (alpha-rounded) ──
face_m = bpy.data.materials.new("Face")
face_m.use_nodes = True
fb = face_m.node_tree.nodes["Principled BSDF"]
fb.inputs["Base Color"].default_value = (0.01, 0.01, 0.012, 1)
fb.inputs["Metallic"].default_value = 0.2
fb.inputs["Roughness"].default_value = 0.42
img = bpy.data.images.load(FACE_PNG)
texn = face_m.node_tree.nodes.new("ShaderNodeTexImage")
texn.image = img
face_m.node_tree.links.new(texn.outputs["Color"], fb.inputs["Emission Color"])
face_m.node_tree.links.new(texn.outputs["Alpha"], fb.inputs["Alpha"])
fb.inputs["Emission Strength"].default_value = 1.1
face_m.blend_method = "BLEND"

bpy.ops.mesh.primitive_plane_add(size=1)
face = bpy.context.object
face.name = "CardFace"
face.scale = (3.42, 2.16, 1)
face.location = (0, 0, 0.0285)
face.data.materials.append(face_m)

# back side: plain dark plane with a magstripe hint
back_m = bpy.data.materials.new("Back")
back_m.use_nodes = True
kb = back_m.node_tree.nodes["Principled BSDF"]
kb.inputs["Base Color"].default_value = (0.045, 0.046, 0.055, 1)
kb.inputs["Metallic"].default_value = 0.5
kb.inputs["Roughness"].default_value = 0.5
bpy.ops.mesh.primitive_plane_add(size=1)
back = bpy.context.object
back.name = "CardBack"
back.scale = (3.3, 2.06, 1)
back.location = (0, 0, -0.0285)
back.rotation_euler = (math.radians(180), 0, 0)
back.data.materials.append(back_m)

# ── preview renders ──
os.makedirs(PREVIEW_DIR, exist_ok=True)
bpy.ops.object.camera_add(location=(0, -5.6, 1.6), rotation=(math.radians(74), 0, 0))
cam = bpy.context.object
bpy.context.scene.camera = cam
bpy.ops.object.light_add(type="AREA", location=(3, -4, 4))
l1 = bpy.context.object
l1.data.energy = 700
l1.data.size = 6
bpy.ops.object.light_add(type="AREA", location=(-4, -2, 2.5))
l2 = bpy.context.object
l2.data.energy = 260
l2.data.color = (1.0, 0.75, 0.25)
l2.data.size = 5

scene = bpy.context.scene
scene.render.resolution_x = 960
scene.render.resolution_y = 540
scene.render.filepath = os.path.join(PREVIEW_DIR, "card-front.png")
bpy.ops.render.render(write_still=True)

# ── export ──
bpy.ops.object.select_all(action="DESELECT")
for name in ("CardBody", "CardFace", "CardBack"):
    bpy.data.objects[name].select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format="GLB", export_apply=True, use_selection=True)
print("EXPORTED:", OUT_GLB)
