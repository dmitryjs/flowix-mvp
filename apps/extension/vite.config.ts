import { resolve } from "node:path";
import { copyFileSync } from "node:fs";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup.html"),
        background: resolve(__dirname, "src/background.ts")
      },
      output: {
        entryFileNames: "[name].js",
        assetFileNames: "assets/[name].[ext]"
      }
    }
  },
  plugins: [
    {
      name: "copy-manifest",
      closeBundle() {
        copyFileSync(resolve(__dirname, "manifest.json"), resolve(__dirname, "dist/manifest.json"));
        copyFileSync(resolve(__dirname, "dist/src/popup.html"), resolve(__dirname, "dist/popup.html"));
      }
    }
  ]
});
