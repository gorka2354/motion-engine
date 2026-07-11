import { describe, it, expect } from "vitest";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import ReactThreeTestRenderer from "@react-three/test-renderer";

// L2 — scene-graph smoke without a GPU. @react-three/test-renderer mounts the R3F
// tree through its own reconciler (no WebGL/canvas), so we can assert scene shape,
// node presence and live transforms — the fast layer between pure geometry units (L1)
// and full pixel renders (L3). Tuple props only (position={[x,y,z]}) — passing
// Vector3/Quaternion instances throws on R3F v9/React 19 (issue #3520).
describe("react-three/test-renderer smoke (L2, no GPU)", () => {
  it("renders an R3F mesh into a scene-graph", async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" />
      </mesh>,
    );
    const graph = renderer.toGraph();
    expect(graph).not.toBeNull();
    expect(graph!.length).toBeGreaterThan(0);
    expect(graph![0].type).toBe("Mesh");
    await renderer.unmount();
  });

  it("advanceFrames ticks useFrame with a fixed delta (deterministic 3D motion)", async () => {
    function Spinner() {
      const ref = useRef<THREE.Mesh>(null);
      useFrame(() => {
        if (ref.current) ref.current.rotation.y += 0.1;
      });
      return (
        <mesh ref={ref}>
          <boxGeometry />
          <meshBasicMaterial />
        </mesh>
      );
    }
    const renderer = await ReactThreeTestRenderer.create(<Spinner />);
    const mesh = renderer.scene.children[0];
    const before = mesh.instance.rotation.y;
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(5, 1);
    });
    // fixed delta in → deterministic transform out (no wall-clock)
    expect(mesh.instance.rotation.y).toBeGreaterThan(before);
    await renderer.unmount();
  });

  it("a <primitive> group's named child stays reachable in the scene (footgun #7 guard)", async () => {
    // mirrors the GLB case: <primitive object={node}> reparents the node into the
    // scene at mount. The named node must remain resolvable — if it's orphaned/gone,
    // getObjectByName returns undefined later, exactly footgun #7.
    const group = new THREE.Group();
    const child = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    child.name = "Card";
    group.add(child);

    const renderer = await ReactThreeTestRenderer.create(<primitive object={group} />);
    let found = false;
    renderer.scene.instance.traverse((o) => {
      if (o.name === "Card") found = true;
    });
    expect(found).toBe(true);
    await renderer.unmount();
  });
});
