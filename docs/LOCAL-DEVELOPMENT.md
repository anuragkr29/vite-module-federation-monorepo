# Local Development Guide

> Complete guide for setting up the development environment with Hot Module Replacement (HMR) for rapid development.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Understanding HMR](#understanding-hmr)
- [Development Workflow](#development-workflow)
- [Debugging Tips](#debugging-tips)
- [Common Issues](#common-issues)

---

## Prerequisites

### Required Software

```bash
# Node.js 20+ (LTS recommended)
node --version  # Should be v20.x or higher

# PNPM 10.x
corepack enable
corepack prepare pnpm@10.26.2 --activate
pnpm --version  # Should be 10.x
```

### IDE Setup (VS Code Recommended)

**Recommended Extensions:**
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Importer
- ES7+ React/Redux/React-Native snippets

**Workspace Settings (.vscode/settings.json):**
```json
"editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.updateImportsOnFileMove.enabled": "always",
  "tailwindCSS.experimental.classRegex": [
    ["tw-([a-zA-Z0-9-]+)", "'([^']*)'"]
  ],
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true
  },
  "files.exclude": {
    "**/.git": true,
    "**/node_modules": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "vscode.typescript-language-features"
  }
```

---

## Development Setup

### 1. Install Dependencies

```bash
# Clone and enter project
git clone https://github.com/yourusername/vite-module-federation-monorepo.git
cd vite-module-federation-monorepo

# Install all workspace dependencies
pnpm install

# or

pnpm install --frozen-lockfile
```

### 2. Start Development Servers

**Option A: Two Terminals (Recommended)**

```bash
# Terminal 1: Start Remote first
pnpm dev:remote

# Terminal 2: Start Host
pnpm dev:host
```

**Option B: Using npm-run-all (Optional)**

```bash
# Add to root package.json scripts:
"dev": "pnpm dev:remote & sleep 2 && pnpm dev:host"

# Then run:
pnpm dev
```

### 3. Access Applications

| Application | URL | Purpose |
|-------------|-----|---------|
| **Host** | http://localhost:3000 | Main application shell |
| **Remote** | http://localhost:5173 | Remote standalone (dev only) |

---

## Understanding HMR

### How Vite HMR Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    Development Architecture                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Browser (localhost:3000)                                      │
│   ┌───────────────────────────────────────────────────────┐     │
│   │                     Host App                          │     │
│   │  ┌─────────────┐        ┌──────────────────────┐      │     │
│   │  │  MUI UI     │        │  Remote Component    │      │     │
│   │  │  (local)    │        │  (from :5000)        │      │     │
│   │  └─────────────┘        └──────────────────────┘      │     │
│   │        │                         │                    │     │
│   │   HMR WebSocket            HTTP Fetch                 │     │
│   │        ▼                         ▼                    │     │
│   └────────┼─────────────────────────┼────────────────────┘     │
│            │                         │                          │
│   ┌────────┴─────────┐    ┌─────────┴──────────┐                │
│   │  Host Vite Dev   │    │  Remote Vite Dev   │                │
│   │  localhost:3000  │    │  localhost:5000    │                │
│   │                  │    │                    │                │
│   │  HMR WebSocket   │    │  HMR WebSocket     │                │
│   │  File Watcher    │    │  File Watcher      │                │
│   └──────────────────┘    └────────────────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### HMR Behavior by App

#### Host App (localhost:3000)

```
File Change → Vite detects → WebSocket push → React Fast Refresh
                                             └→ Component re-renders
                                             └→ State preserved ✓
```

**Supported Hot Updates:**
- ✅ Component JSX/TSX changes
- ✅ CSS/SCSS changes
- ✅ Module imports
- ⚠️ Root App.tsx (may need refresh)

#### Remote App (localhost:5000)

When developing Remote standalone:
```
File Change → Vite detects → WebSocket push → React Fast Refresh
```

When Remote is loaded in Host:
```
Remote File Change → Remote Vite rebuilds → Host re-fetches module
                                         └→ Component re-renders
```

**Note:** Changes to Remote while loaded in Host require a **page refresh** of the Host application. This is a limitation of Module Federation at dev time.

### HMR Configuration

**Host Vite Config:**
```typescript
// apps/host/vite.config.ts
export default defineConfig({
  server: {
    port: 3000,
    // HMR is enabled by default
  }
})
```

**Remote Vite Config:**
```typescript
// apps/remote/vite.config.ts
export default defineConfig({
  base: "/",
  server: {
    port: 5000
  }
})
```

---

## Development Workflow

### Scenario 1: Working on Host Only

```bash
# Start only host (remote not needed if not using /remote-app route)
pnpm dev:host

# Navigate to http://localhost:3000
# Full HMR on all host files
```

### Scenario 2: Working on Remote Only

```bash
# Start only remote (standalone mode)
pnpm dev:remote

# Navigate to http://localhost:5000
# Full HMR on all remote files
# Uses remote's own index.html
```

### Scenario 3: Full Integration Development

```bash
# Terminal 1
pnpm dev:remote

# Terminal 2 (wait for remote to start)
pnpm dev:host

# Navigate to http://localhost:3000/remote-app
# Host changes: instant HMR
# Remote changes: refresh host page
```

### Recommended Workflow

1. **Develop Remote standalone first** at `localhost:5000`
   - Full HMR support
   - Faster iteration
   - Test in isolation

2. **Integrate with Host** when ready
   - Start both servers
   - Test routing and context passing
   - Verify CSS isolation

3. **Test Production build** periodically
   ```bash
   pnpm build
   docker build -t mfe-test .
   docker run -p 8080:80 mfe-test
   # Visit http://localhost:8080
   ```

---

## Debugging Tips

### 1. Check Module Federation Loading

Open browser DevTools → Network tab → Filter by "remoteEntry"

```
✓ Should see: remoteEntry.js loaded from localhost:5000
✓ Status: 200
✓ Type: script
```

### 2. Verify Shared Dependencies

In browser console:
```javascript
// Check if React is shared (single instance)
window.__federation_shared__
```

### 3. CSS Not Loading?

Check the wrapper pattern is used:
```typescript
// apps/remote/vite.config.ts
exposes: {
  "./App": "./src/RemoteApp.tsx"  // NOT App.tsx directly
}
```

Verify RemoteApp.tsx imports CSS:
```tsx
// apps/remote/src/RemoteApp.tsx
import "./index.css";  // This line is critical
```

### 4. TypeScript Errors for Remote Import

If `import('remote/App')` shows TS error:

```typescript
// apps/host/src/vite-env.d.ts
declare module 'remote/App' {
  const RemoteApp: React.ComponentType;
  export default RemoteApp;
}
```

### 5. Console Logging Module Load

```tsx
// apps/host/src/RemotePage.tsx
const RemoteApp = lazy(() => {
  console.log('Loading remote module...');
  return import('remote/App').then(module => {
    console.log('Remote loaded:', module);
    return module;
  });
});
```

---

## Common Issues

### Issue: "Failed to fetch dynamically imported module"

**Cause:** Remote dev server not running

**Solution:**
```bash
# Ensure remote is running first
pnpm dev:remote
# Then start host
pnpm dev:host
```

### Issue: Styles not applying in Host

**Cause:** CSS not imported in wrapper component

**Solution:** Verify `RemoteApp.tsx`:
```tsx
import "./index.css";  // Must be in RemoteApp, not App
```

### Issue: Duplicate React instances

**Symptoms:** Hooks error, invalid hook call

**Cause:** React not properly shared

**Solution:** Check both configs have matching shared deps:
```typescript
shared: {
  react: { singleton: true, requiredVersion: "^19.0.0" },
  "react-dom": { singleton: true, requiredVersion: "^19.0.0" }
}
```

### Issue: HMR not working in Host

**Cause:** May be normal for root App changes

**Solution:** 
- For most component changes, HMR should work
- Root-level changes may require refresh
- Check browser console for HMR status messages

### Issue: CORS errors loading remote

**Cause:** Browser blocking cross-origin requests

**Solution:** Both servers should allow CORS in dev (Vite does by default). If issues persist:

```typescript
// apps/remote/vite.config.ts
server: {
  cors: true
}
```

---

## VS Code Launch Configuration

Create `.vscode/launch.json` for debugging:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug Host",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/apps/host/src"
    },
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug Remote",
      "url": "http://localhost:5000",
      "webRoot": "${workspaceFolder}/apps/remote/src"
    }
  ]
}
```

---

## Next Steps

- [Production Deployment](PRODUCTION-DEPLOYMENT.md) — Docker and CI/CD setup
- [Architecture Guide](ARCHITECTURE.md) — Understanding the design
- [Use Cases](USE-CASES.md) — When to use this pattern
