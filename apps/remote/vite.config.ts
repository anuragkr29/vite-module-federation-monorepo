import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "remote",
      filename: "remoteEntry.mjs",
      exposes: {
        // Expose wrapper component that handles CSS automatically
        "./App": "./src/RemoteApp.tsx"
      },
      shared: {
        react: { singleton: true, requiredVersion: "^19.0.0" },
        "react-dom": { singleton: true, requiredVersion: "^19.0.0" },
        "@mfe/shared": { singleton: true }
      }
    })
  ],
  build: {
    target: "esnext",
    minify: true,
    // cssCodeSplit: true allows Vite MFE plugin to handle CSS automatically
    cssCodeSplit: true
  },
  base: "/mf/"
});
