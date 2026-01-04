import { defineConfig, ViteDevServer } from "vite";
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

// Middleware to serve remoteEntry.js with correct content type in dev mode
const mfeDevMiddleware = () => ({
  name: 'mfe-dev-middleware',
  configureServer(server: ViteDevServer) {
    // Handle remoteEntry.js requests
    server.middlewares.use((req, res, next) => {
      if (req.url === '/remoteEntry.js' || req.url === '/remoteEntry.js?v=dev') {
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        // Don't cache in dev
        res.setHeader('Cache-Control', 'no-cache');
      }
      next();
    });
  },
});

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "remote",
      filename: "remoteEntry.js",
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
  base: process.env.NODE_ENV === 'production' ? '/mf/' : '/',
  server: {
    port: 5000,
    strictPort: true,
    origin: "http://localhost:5000",
  }
});
