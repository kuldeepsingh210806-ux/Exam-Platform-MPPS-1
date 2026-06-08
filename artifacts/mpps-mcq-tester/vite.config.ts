import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const port = Number(process.env.PORT || 3000);
const basePath = process.env.BASE_PATH || "/";
const isReplit = !!process.env.REPL_ID;

export default defineConfig(async () => {
  const plugins = [react(), tailwindcss()];

  if (isReplit) {
    const { default: runtimeErrorOverlay } = await import("@replit/vite-plugin-runtime-error-modal");
    plugins.push(runtimeErrorOverlay());
  }

  return {
    base: basePath,

    plugins,

    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(
          import.meta.dirname,
          "..",
          "..",
          "attached_assets"
        ),
      },
      dedupe: ["react", "react-dom"],
    },

    build: {
      outDir: "dist",
      emptyOutDir: true,
    },

    server: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
    },

    preview: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});
