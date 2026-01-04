# Architecture Guide

> Deep dive into the Vite Module Federation architecture, design decisions, and implementation details.

## Table of Contents

- [Overview](#overview)
- [Design Decisions](#design-decisions)
- [Module Federation Explained](#module-federation-explained)
- [Build Configuration](#build-configuration)
- [Nginx Configuration](#nginx-configuration)
- [Security Considerations](#security-considerations)
- [Performance Optimizations](#performance-optimizations)

---

## Overview

This project implements **Option A: Module Federation with Static Assets** — where the remote application is built separately and exposed as a `remoteEntry.js` file, which is dynamically loaded by the host at runtime.

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                 Build Time                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                      │
│   │   shared    │    │   remote    │    │    host     │                      │
│   │  (library)  │    │    (MFE)    │    │   (shell)   │                      │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                      │
│          │                  │                  │                             │
│          ▼                  ▼                  ▼                             │
│    ┌──────────┐       ┌──────────┐       ┌──────────┐                        │
│    │   dist/  │       │   dist/  │       │   dist/  │                        │
│    │ index.js │       │ remoteE  │       │ index.   │                        │
│    │          │       │ ntry.js  │       │ html     │                        │
│    └──────────┘       │ assets/* │       │ assets/* │                        │
│                       └──────────┘       └──────────┘                        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                                Docker Build                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Multi-stage Dockerfile:                                                    │
│   1. Builder stage: pnpm install && build all apps                           │
│   2. Runtime stage: nginx:alpine with static files only                      │
│                                                                              │
│   ┌────────────────────────────────────────────────────────────────┐         │
│   │  /usr/share/nginx/html/                                        │         │
│   │  ├── index.html          (host entry)                          │         │
│   │  ├── assets/             (host JS/CSS chunks)                  │         │
│   │  └── mf/                                                       │         │
│   │      ├── assets/                                               │         │
│   │      │   ├── remoteEntry.js    (federation entry)              │         │
│   │      │   ├── __federation_*     (exposed modules)              │         │
│   │      │   └── index-*.css        (remote styles)                │         │
│   └────────────────────────────────────────────────────────────────┘         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                                 Runtime                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Browser Request Flow:                                                      │
│                                                                              │
│   1. GET /                    → index.html (host shell)                      │
│   2. GET /assets/*.js         → host application chunks                      │
│   3. Navigate to /remote-app                                                 │
│   4. GET /mf/remoteEntry.js    → federation manifest                         │
│   5. GET /mf/assets/__federation_*     → remote component code               │
│   6. GET /mf/assets/index-*.css        → remote styles (auto-injected)       │
│                                                                              │
│   ┌──────────────────────┐                                                   │
│   │    Nginx Server      │                                                   │
│   │  ┌────────────────┐  │                                                   │
│   │  │  /             │──│──▶ Host SPA (try_files → index.html)              │
│   │  │  /mf/*         │──│──▶ Remote assets (static, no HTML)                │
│   │  └────────────────┘  │                                                   │
│   └──────────────────────┘                                                   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Design Decisions

### Why Module Federation over NPM Package?

| Approach | Pros | Cons |
|----------|------|------|
| **Module Federation** | Runtime loading, independent deploys, no host rebuild | More complex setup, runtime overhead |
| **NPM Package** | Simple, type-safe, no runtime fetching | Host must rebuild on remote changes |

**We chose Module Federation because:**
1. Teams can deploy remotes independently
2. Host doesn't need to rebuild when remote updates
3. Enables A/B testing and gradual rollouts
4. Allows different release cycles

### Why Single Container?

Many MFE architectures deploy each microfrontend to separate servers. I chose a single container because:

1. **Simplified Operations**: One Docker image, one deployment
2. **No CORS Issues**: Same-origin requests for module loading
3. **Reduced Latency**: No cross-server network hops
4. **Lower Costs**: Single server, simplified infrastructure
5. **Future-Ready**: Can split later without code changes

### Why Vite over Webpack?

| Feature | Vite | Webpack |
|---------|------|---------|
| Dev Server Start | ~300ms | ~3-10s |
| HMR Speed | <50ms | 100-500ms |
| Build Time | Fast (esbuild) | Slower |
| Config Complexity | Minimal | Complex |
| Native ESM | ✅ Yes | ⚠️ Optional |

---

## Module Federation Explained

### Remote Configuration

```typescript
// apps/remote/vite.config.ts
federation({
  name: "remote",                    // Unique identifier
  filename: "remoteEntry.js",       // Entry point filename
  exposes: {
    "./App": "./src/RemoteApp.tsx"   // What we expose to host
  },
  shared: {
    react: { singleton: true },      // Shared as single instance
    "react-dom": { singleton: true },
    "@mfe/shared": { singleton: true }
  }
})
```

**Key Points:**
- `exposes`: Components available to consuming applications
- `shared`: Dependencies shared between host and remote (prevents duplication)
- `singleton: true`: Ensures only one React instance runs

### Host Configuration

```typescript
// apps/host/vite.config.ts
federation({
  name: "host",
  remotes: {
    // Development: Point to remote's dev server
    // Production: Relative path (same server)
    remote: `${process.env.NODE_ENV === 'production' 
      ? '' 
      : 'http://localhost:5173'}/remoteEntry.mjs`
  },
  shared: {
    react: { singleton: true },
    "react-dom": { singleton: true },
    "@mfe/shared": { singleton: true }
  }
})
```

### CSS Loading Strategy

The remote uses a **Wrapper Component Pattern**:

```tsx
// RemoteApp.tsx - Exposed to host
import App from "./App";
import "./index.css";  // CSS imported here

function RemoteApp() {
  return <App />;
}

export default RemoteApp;
```

**Why this pattern?**
1. The Vite federation plugin auto-detects CSS imports
2. Generates `dynamicLoadingCss()` function in `remoteEntry.mjs`
3. CSS is automatically injected when module loads
4. No manual DOM manipulation needed

---

## Build Configuration

### Build Order

```bash
# Critical: Build in dependency order
pnpm build:shared  # 1. Shared library first
pnpm build:remote  # 2. Remote second (depends on shared)
pnpm build:host    # 3. Host last (depends on shared + remote manifest)
```

### Output Structure

```
apps/remote/dist/
├── assets/
│   ├── remoteEntry.js           # Federation entry
│   ├── __federation_expose_App-*.js
│   ├── __federation_shared_*.js
│   └── index-*.css               # Tailwind styles
└── (no index.html in production) # Security: no direct access

apps/host/dist/
├── index.html                    # SPA entry
└── assets/
    ├── index-*.js                # App bundle
    └── index-*.css               # MUI styles
```

---

## Nginx Configuration

### Location Blocks Explained

```nginx
# Host SPA - All routes handled by React Router
location / {
  root /usr/share/nginx/html;
  try_files $uri $uri/ /index.html;  # SPA fallback
  add_header Cache-Control "no-cache";  # Always fetch fresh HTML
}

# Remote MF Assets - Static files only
location /mf/ {
  root /usr/share/nginx/html;
  autoindex off;  # No directory listing
  
  # CORS headers for module federation
  add_header 'Access-Control-Allow-Origin' '*' always;
  
  # Block HTML access (security)
  location ~ \.html$ {
    return 404;
  }
  
  # Long cache for immutable assets
  location ~* \.(js|css)$ {
    add_header Cache-Control "public, immutable" always;
    expires 1y;
  }
}
```

### Why Block HTML in /mf/?

1. **Security**: Prevents remote from being accessed as standalone app
2. **Clarity**: Single entry point through host application
3. **Control**: Authentication/authorization handled by host

---

## Security Considerations

### 1. Remote Not Publicly Browsable

The remote application cannot be accessed directly:
- No `index.html` served from `/mf/`
- Only JS/CSS/assets allowed
- Host controls all user-facing entry points

### 2. CORS Configuration

```nginx
add_header 'Access-Control-Allow-Origin' '*' always;
add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS' always;
```

**Note**: In production, replace `*` with your specific domains.

### 3. Content Security Policy

Consider adding CSP headers:

```nginx
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
" always;
```

---

## Performance Optimizations

### 1. Shared Dependencies

React and React-DOM are shared as singletons:
- **Benefit**: Loaded once, used by both host and remote
- **Size Reduction**: ~40KB saved per remote

### 2. Code Splitting

Federation automatically code-splits:
- Remote chunks loaded only when route accessed
- Host bundles remain small

### 3. Caching Strategy

| Asset Type | Cache Strategy |
|------------|----------------|
| `index.html` | `no-cache` (always fresh) |
| `*.js` | `immutable, 1y` (content-hashed) |
| `*.css` | `immutable, 1y` (content-hashed) |

### 4. Gzip Compression

```nginx
gzip on;
gzip_types text/plain text/css application/javascript application/json;
gzip_min_length 1024;
```

---

## Comparison: Same-Server vs Separate Servers

### Current: Same Server

```
┌─────────────────────┐
│    Single Nginx     │
│  ┌───────────────┐  │
│  │ Host (/)      │  │
│  │ Remote (/mf/) │  │
│  └───────────────┘  │
└─────────────────────┘
```

**Pros:**
- Simple deployment
- No CORS issues
- Lower latency
- Single Docker image

**Cons:**
- Coupled deployments
- Single point of failure

### Future: Separate Servers

```
┌─────────────────────┐     ┌─────────────────────┐
│    Host Server      │     │   Remote Server     │
│  example.com        │◀───▶│  remote.example.com │
└─────────────────────┘     └─────────────────────┘
```

**Migration Required:**
```typescript
// Only change in host/vite.config.ts:
remotes: {
  remote: {
        name: "remote",
        type: "module",
        entry: process.env.NODE_ENV === 'production'
            ? '/mf/remoteEntry.js' // this url needs change based on new remote server
            : 'http://localhost:5000/remoteEntry.js'
      }
}
```

**No code changes needed!** The architecture supports this migration path.

---

## Next Steps

- [Local Development Guide](LOCAL-DEVELOPMENT.md) — Setting up HMR
- [Production Deployment](PRODUCTION-DEPLOYMENT.md) — CI/CD setup
- [Use Cases](USE-CASES.md) — When to use this pattern
