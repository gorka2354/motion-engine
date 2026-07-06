import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Render-safe GLTF/GLB loader: holds the frame via delayRender until the
 * model is in. Assets come from Blender (headless script or blender-mcp)
 * into public/models/*.glb.
 */
export const useGltf = (url: string): GLTF | null => {
  const [handle] = useState(() => delayRender(`gltf: ${url}`));
  const [gltf, setGltf] = useState<GLTF | null>(null);
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (g) => {
        setGltf(g);
        continueRender(handle);
      },
      undefined,
      (err) => {
        throw new Error(`GLTF load failed: ${url} — ${err}`);
      },
    );
  }, [url, handle]);
  return gltf;
};
