import { defineConfig } from "vite";
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';


export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "host",
      remotes: {
        remote: {
          name: "remote",
          type: "module",
          entry: process.env.NODE_ENV === 'production'
            ? '/mf/remoteEntry.js' // this is based of Dockerfile NGINX setup
            : 'http://localhost:5000/remoteEntry.js'
        }
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
    port: 3000,
    strictPort: true
  }
});
