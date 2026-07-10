import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Render-safe GLTF/GLB loader: holds the frame via delayRender until the
 * model is actually committed to the tree. Assets come from Blender (headless
 * script or blender-mcp) into public/models/*.glb.
 *
 * ⚠️ continueRender runs in a SEPARATE effect that fires only after a render
 * pass with gltf !== null — NOT inside the loader callback. Releasing the frame
 * straight after setGltf() lets Remotion capture the frame before React has
 * re-rendered with the model, so a warm-up / concurrent render chunk grabs a
 * frame with the GLB still absent (the card vanishes, only primitives show).
 * Splitting it closes that race.
 */
export const useGltf = (url: string): GLTF | null => {
  const [handle] = useState(() => delayRender(`gltf: ${url}`));
  const [gltf, setGltf] = useState<GLTF | null>(null);
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (g) => setGltf(g),
      undefined,
      (err) => {
        throw new Error(`GLTF load failed: ${url} — ${err}`);
      },
    );
  }, [url]);
  useEffect(() => {
    if (gltf) continueRender(handle);
  }, [gltf, handle]);
  return gltf;
};
