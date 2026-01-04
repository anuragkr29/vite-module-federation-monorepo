import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "host",
      remotes: {
        remote: `${process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173'}/mf/assets/remoteEntry.mjs`
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
    minify: true
  },
  server: {
    port: 3000
  }
});
