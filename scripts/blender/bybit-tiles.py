# Five 3D service tiles: extruded squircles (vertex bevel + solidify) with
# the React-rendered logo faces baked as emissive alpha textures. Each tile
# is parented to an empty «Tile{i}» standing upright — runtime orbits the
# empties. Run: blender --background --python bybit-tiles.py
import bpy
import math
import os

OUT_GLB = r"C:\Users\pesto\Desktop\motion-engine\public\models\bybit-tiles.glb"
TEX_DIR = r"C:\Users\pesto\Desktop\motion-engine\public\bybit"
PREVIEW_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "out", "bybit")

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()
for block in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras, bpy.data.images):
    for item in list(block):
        try:
            block.remove(item)
        except Exception:
            pass

body_m = bpy.data.materials.new("TileBody")
body_m.use_nodes = True
bb = body_m.node_tree.nodes["Principled BSDF"]
bb.inputs["Base Color"].default_value = (0.035, 0.036, 0.042, 1)
bb.inputs["Metallic"].default_value = 0.55
bb.inputs["Roughness"].default_value = 0.4

export_names = []
for i in range(5):
    # standing empty — the runtime orbit handle
    bpy.ops.object.empty_add(location=(i * 2.2 - 4.4, 0, 0))
    root = bpy.context.object
    root.name = f"Tile{i}"
    root.rotation_euler = (math.radians(90), 0, 0)
    export_names.append(root.name)

    # body: squircle slab
    bpy.ops.mesh.primitive_plane_add(size=1)
    body = bpy.context.object
    body.name = f"TileBody{i}"
    body.scale = (1.5, 1.5, 1)
    bpy.ops.object.transform_apply(scale=True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.bevel(offset=0.34, segments=8, affect="VERTICES")
    bpy.ops.object.mode_set(mode="OBJECT")
    sol = body.modifiers.new("sol", "SOLIDIFY")
    sol.thickness = 0.13
    sol.offset = 0
    body.data.materials.append(body_m)
    export_names.append(body.name)

    # face texture
    face_m = bpy.data.materials.new(f"TileFace{i}")
    face_m.use_nodes = True
    fb = face_m.node_tree.nodes["Principled BSDF"]
    fb.inputs["Base Color"].default_value = (0.01, 0.01, 0.012, 1)
    fb.inputs["Roughness"].default_value = 0.42
    img = bpy.data.images.load(os.path.join(TEX_DIR, f"tile-{i}.png"))
    texn = face_m.node_tree.nodes.new("ShaderNodeTexImage")
    texn.image = img
    face_m.node_tree.links.new(texn.outputs["Color"], fb.inputs["Emission Color"])
    face_m.node_tree.links.new(texn.outputs["Alpha"], fb.inputs["Alpha"])
    fb.inputs["Emission Strength"].default_value = 1.0
    face_m.blend_method = "BLEND"

    bpy.ops.mesh.primitive_plane_add(size=1)
    face = bpy.context.object
    face.name = f"TileFaceMesh{i}"
    face.scale = (1.5, 1.5, 1)
    face.location = (0, 0, 0.068)
    face.data.materials.append(face_m)
    export_names.append(face.name)

    # dark back face (tiles tumble — the back must not be a hole);
    # corners MUST be beveled like the body: a plain square back pokes its
    # sharp corners past the rounded silhouette when the tile sways
    bpy.ops.mesh.primitive_plane_add(size=1)
    backf = bpy.context.object
    backf.name = f"TileBack{i}"
    backf.scale = (1.42, 1.42, 1)
    bpy.ops.object.transform_apply(scale=True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.bevel(offset=0.32, segments=8, affect="VERTICES")
    bpy.ops.object.mode_set(mode="OBJECT")
    backf.location = (0, 0, -0.068)
    backf.rotation_euler = (math.radians(180), 0, 0)
    backf.data.materials.append(body_m)
    export_names.append(backf.name)

    # parent parts INTO the empty's local space (no keep-transform: the
    # parts snap into the standing, offset root — exactly what we want)
    for part in (body, face, backf):
        part.parent = root

# ── preview ──
os.makedirs(PREVIEW_DIR, exist_ok=True)
bpy.ops.object.camera_add(location=(0, -7.5, 1.2), rotation=(math.radians(82), 0, 0))
cam = bpy.context.object
bpy.context.scene.camera = cam
bpy.ops.object.light_add(type="AREA", location=(3, -5, 4))
l1 = bpy.context.object
l1.data.energy = 800
l1.data.size = 7
scene = bpy.context.scene
scene.render.resolution_x = 1280
scene.render.resolution_y = 400
scene.render.filepath = os.path.join(PREVIEW_DIR, "tiles-row.png")
bpy.ops.render.render(write_still=True)

# ── export ──
bpy.ops.object.select_all(action="DESELECT")
for name in export_names:
    bpy.data.objects[name].select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format="GLB", export_apply=True, use_selection=True)
print("EXPORTED:", OUT_GLB)
