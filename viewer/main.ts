/**
 * Interactive viewer for the procedural model factories.
 *
 * Remotion renders frames — it has no orbit-with-the-mouse mode by design. This is the missing
 * inspection surface: the SAME factory functions the compositions use, mounted in a plain
 * three.js scene with OrbitControls. No export step, no .glb, no duplicated model code — import
 * the factory and look at it.
 *
 * Run: npm run viewer
 */
import {
  ACESFilmicToneMapping,
  AmbientLight,
  Box3,
  Color,
  GridHelper,
  Group,
  Mesh,
  MeshStandardMaterial,
  PMREMGenerator,
  PerspectiveCamera,
  PointLight,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { createGamepadModel } from "../src/models/gamepad/createGamepadModel";
import { createLaptopModel } from "../src/models/laptop/createLaptopModel";

type Entry = {
  id: string;
  name: string;
  note: string;
  build: () => { group: Group; parts: Record<string, unknown> };
};

const CATALOG: Entry[] = [
  {
    id: "gamepad",
    name: "Game controller",
    note: "traced from one product photo",
    build: () => createGamepadModel(),
  },
  {
    id: "laptop",
    name: "Laptop",
    note: "lid open — hinge pivot",
    build: () => {
      const m = createLaptopModel();
      m.parts.lid.rotation.x = -1.78;
      return m;
    },
  },
];

const stage = document.getElementById("stage") as HTMLDivElement;
const renderer = new WebGLRenderer({ antialias: true });
renderer.outputColorSpace = SRGBColorSpace;
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
stage.appendChild(renderer.domElement);

const scene = new Scene();
scene.background = new Color("#101216");

const pmrem = new PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;

const camera = new PerspectiveCamera(32, 1, 0.1, 100);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.autoRotateSpeed = 1.6;

scene.add(new AmbientLight(0xffffff, 0.5));
const key = new PointLight(0xffffff, 180);
key.position.set(3, 4.5, 6);
scene.add(key);
const fill = new PointLight(0xffffff, 100);
fill.position.set(-4.5, 2, 4.5);
scene.add(fill);
const rim = new PointLight(0xdfe6ff, 70);
rim.position.set(0, -1.5, -4.5);
scene.add(rim);

const grid = new GridHelper(12, 24, 0x2c323d, 0x1c2028);
scene.add(grid);

let current: Group | null = null;

/** Frame the model: fit the camera to its bounding sphere and rest the grid under it. */
const frameObject = (obj: Group): void => {
  const box = new Box3().setFromObject(obj);
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  const radius = Math.max(size.x, size.y, size.z) * 0.5;
  // Fit against whichever FOV is tighter. Using the vertical one alone crops the model
  // horizontally on a narrow window — the sidebar makes the stage narrow by default.
  const vFov = (camera.fov * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  const dist = radius / Math.sin(Math.min(vFov, hFov) / 2);
  controls.target.copy(center);
  camera.position.set(center.x, center.y + radius * 0.15, center.z + dist * 1.25);
  camera.near = dist / 100;
  camera.far = dist * 10;
  camera.updateProjectionMatrix();
  grid.position.y = box.min.y - 0.02;
};

const stats = {
  meshes: document.getElementById("s-meshes")!,
  tris: document.getElementById("s-tris")!,
  mats: document.getElementById("s-mats")!,
  parts: document.getElementById("s-parts")!,
};

const load = (entry: Entry): void => {
  if (current) {
    scene.remove(current);
    current.traverse((o) => {
      if (o instanceof Mesh) {
        o.geometry.dispose();
        const m = o.material;
        (Array.isArray(m) ? m : [m]).forEach((mm) => mm.dispose());
      }
    });
  }
  const model = entry.build();
  current = model.group;
  scene.add(current);
  frameObject(current);

  let meshes = 0;
  let tris = 0;
  const mats = new Set<unknown>();
  current.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    meshes++;
    const count =
      (o.geometry.index?.count ?? o.geometry.getAttribute("position")?.count ?? 0) / 3;
    // InstancedMesh multiplies its geometry by the instance count
    tris += Math.round(count) * ((o as { count?: number }).count ?? 1);
    (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => mats.add(m));
  });
  stats.meshes.textContent = String(meshes);
  stats.tris.textContent = tris.toLocaleString("en-US");
  stats.mats.textContent = String(mats.size);
  stats.parts.textContent = Object.keys(model.parts).join(", ") || "–";
  applyWireframe();
};

// ── sidebar wiring ──
const list = document.getElementById("models")!;
const buttons = CATALOG.map((entry) => {
  const b = document.createElement("button");
  b.className = "model";
  b.type = "button";
  b.append(entry.name);
  const note = document.createElement("span");
  note.textContent = entry.note;
  b.append(note);
  b.addEventListener("click", () => {
    load(entry);
    buttons.forEach((other) =>
      other.setAttribute("aria-pressed", String(other === b)),
    );
  });
  list.appendChild(b);
  return b;
});

const wireBox = document.getElementById("wire") as HTMLInputElement;
const applyWireframe = (): void => {
  current?.traverse((o) => {
    if (o instanceof Mesh) {
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
        if (m instanceof MeshStandardMaterial) m.wireframe = wireBox.checked;
      });
    }
  });
};
wireBox.addEventListener("change", applyWireframe);

const spinBox = document.getElementById("spin") as HTMLInputElement;
spinBox.addEventListener("change", () => {
  controls.autoRotate = spinBox.checked;
});
controls.autoRotate = spinBox.checked;

const gridBox = document.getElementById("grid") as HTMLInputElement;
gridBox.addEventListener("change", () => {
  grid.visible = gridBox.checked;
});

const bgRange = document.getElementById("bg") as HTMLInputElement;
bgRange.addEventListener("input", () => {
  const v = Number(bgRange.value) / 100;
  (scene.background as Color).setRGB(v, v, v * 1.04);
});

const resize = (): void => {
  const { clientWidth: w, clientHeight: h } = stage;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
};
addEventListener("resize", resize);
resize();

buttons[0].click();

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});
