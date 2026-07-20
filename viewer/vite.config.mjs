import { defineConfig } from "vite";

/**
 * Standalone dev server for the model viewer. Deliberately separate from the Remotion bundle:
 * Remotion renders frames, this is the orbit-with-the-mouse surface. Both import the same
 * factories from src/models/, so there is one source of model truth.
 */
export default defineConfig({
  root: __dirname,
  server: {
    open: true,
    // Bind IPv4 explicitly: vite's default binding came up IPv6-only on this machine, and a
    // browser resolving localhost to 127.0.0.1 then gets connection-refused.
    host: "127.0.0.1",
    port: 5173,
    strictPort: false,
  },
  // the viewer lives in viewer/ but imports from ../src — allow vite to serve the parent
  resolve: { preserveSymlinks: true },
});
