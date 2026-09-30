import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // If you deploy to a sub-folder (e.g. GitHub Pages project site), set base: "/repo-name/"
  base: "/",
  build: {
    // The 3D engine (three.js) is one ~900 kB file, downloaded only when a 3D scene is shown
    chunkSizeWarningLimit: 1000,
  },
  css: {
    modules: {
      // Readable, stable class names like "Hero_title__a1b2c" (same in client + prerender builds)
      generateScopedName: "[name]_[local]__[hash:base64:5]",
    },
  },
});
