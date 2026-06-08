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
    const { default: runtimeErrorOverlay } = await import(
      "@replit/vite-plugin-runtime-error-modal"
    );
    plugins.push(runtimeErrorOverlay());
  }

  return {
    base: basePath,

    plugins,

    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
      },
      dedupe: ["react", "react-dom"],
    },

    build: {
      outDir: "dist",
      emptyOutDir: true,
      // Raise limit to 2000 kB so Netlify CI doesn't treat the warning as a fatal error
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Firebase — largest dependency, its own chunk
            if (id.includes("node_modules/firebase") || id.includes("node_modules/@firebase")) {
              return "firebase";
            }
            // React core
            if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") ||
                id.includes("node_modules/scheduler")) {
              return "react-vendor";
            }
            // Radix UI primitives
            if (id.includes("node_modules/@radix-ui")) {
              return "radix-ui";
            }
            // Charts
            if (id.includes("node_modules/recharts") || id.includes("node_modules/d3")) {
              return "charts";
            }
            // Animation
            if (id.includes("node_modules/framer-motion")) {
              return "motion";
            }
            // Routing + query
            if (id.includes("node_modules/wouter") || id.includes("node_modules/@tanstack")) {
              return "router-query";
            }
            // Icons
            if (id.includes("node_modules/lucide-react") || id.includes("node_modules/react-icons")) {
              return "icons";
            }
          },
        },
      },
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
