# Vite Module Federation Monorepo

> **Production-Ready Microfrontend Architecture** — A complete reference implementation demonstrating how to build, deploy, and scale microfrontends using Vite, Module Federation, React 19, and PNPM workspaces. The apps are served using the same nginx server, removing bottlenecks for maintaining a different remote server which becomes a major challenge

[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Nginx](https://img.shields.io/badge/Nginx-1.27-009639?logo=nginx&logoColor=white)](https://nginx.org/)

---

## 🎯 Problem Statement

Modern enterprise applications often face these architectural challenges:

### **1. Monolith Frontend Bottleneck**
Large frontend codebases become difficult to maintain, with slow build times and deployment cycles. Changes in one feature can affect the entire application.

### **2. Team Scalability**
Multiple teams working on the same repository leads to merge conflicts, deployment coordination overhead, and blocked releases.

### **3. Technology Lock-in**
Upgrading frameworks (React, Angular, Vue) or UI libraries becomes risky and time-consuming when the entire application shares the same dependencies.

### **4. Independent Deployability**
Teams cannot deploy their features independently — a bug in one team's code blocks releases for everyone.

### **5. CSS Isolation**
Different parts of the application may require different styling systems (e.g., MUI for admin, Tailwind for marketing) without conflicts.

---

## 💡 Solution: Module Federation Architecture

This project demonstrates a **production-ready** solution to these problems using **Vite Module Federation**:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Single Nginx Container                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  /                    Host Application (MUI)            │    │
│  │  ├── /remote-app      → Loads Remote via Module Fed     │    │
│  │  └── /about           → Host's own pages                │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  /mf/*                Remote Assets (Tailwind)          │    │
│  │  └── remoteEntry.mjs  → Module Federation entry point   │    │
│  │  └── *.css, *.js      → Remote's chunks (not browsable) │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Key Features

| Feature | Benefit |
|---------|---------|
| **Single Container Deployment** | Simplified ops, one Docker image serves everything |
| **Runtime Module Loading** | Remote loaded dynamically, no rebuild of host needed |
| **Isolated CSS Strategies** | MUI (host) + Tailwind (remote) without conflicts |
| **Zero-Refactor Migration Path** | Move remote to separate server without code changes |
| **Shared Dependencies** | React, React-DOM shared as singletons |
| **Security by Design** | Remote has no public HTML — only JS assets served |

---

## 📁 Project Structure

```
vite-module-federation-monorepo/
├── apps/
│   ├── host/                    # Main application (Material-UI)
│   │   ├── src/
│   │   │   ├── App.tsx          # Main app with routing
│   │   │   ├── RemotePage.tsx   # Lazy loads remote module
│   │   │   └── main.tsx         # Application entry
│   │   └── vite.config.ts       # Federation consumer config
│   │
│   ├── remote/                  # Microfrontend (Tailwind CSS)
│   │   ├── src/
│   │   │   ├── App.tsx          # Pure component logic
│   │   │   ├── RemoteApp.tsx    # Wrapper exposing to host
│   │   │   └── index.css        # Tailwind with tw- prefix
│   │   └── vite.config.ts       # Federation provider config
│   │
│   └── shared/                  # Shared utilities & types
│       └── src/
│           └── index.ts         # Common exports
│
├── docs/                        # Documentation
│   ├── ARCHITECTURE.md          # Detailed architecture guide
│   ├── LOCAL-DEVELOPMENT.md     # HMR and dev workflow
│   ├── PRODUCTION-DEPLOYMENT.md # Docker & Nginx setup
│   └── USE-CASES.md             # When to use this pattern
│
├── Dockerfile                   # Multi-stage production build
├── nginx.conf                   # Production server config
├── pnpm-workspace.yaml          # PNPM workspace definition
└── package.json                 # Root scripts
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **PNPM** 10.x (`corepack enable && corepack prepare pnpm@10.26.0 --activate`)
- **Docker** (for production builds)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/vite-module-federation-monorepo.git
cd vite-module-federation-monorepo

# Install dependencies from lockfile
pnpm install --frozen-lockfile
```

### Development (with HMR)

```bash
# Terminal 1: Start Remote dev server
pnpm dev:remote

# Terminal 2: Start Host dev server
pnpm dev:host
```

| App | URL | Description |
|-----|-----|-------------|
| Host | http://localhost:3000 | Main application |
| Remote | http://localhost:5000 | Remote standalone (dev only) |

### Production Build

```bash
# Build all apps in correct order
pnpm build

# Or build individually
pnpm build:shared
pnpm build:remote
pnpm build:host
```

### Docker Deployment

```bash
# Build production image
docker build -t vite-mfe-monorepo .

# Run container
docker run -p 8080:80 vite-mfe-monorepo

# Access at http://localhost:8080
```

---

## 🔧 How It Works

### Development Mode (Vite Dev Server)

```
┌─────────────────┐          ┌─────────────────┐
│  Host Dev       │  HTTP    │  Remote Dev     │
│  localhost:3000 │ ◀──────▶ │  localhost:5000 │
│  (Vite HMR)     │          │  (Vite HMR)     │
└─────────────────┘          └─────────────────┘
        │                            │
        │  Full HMR support          │
        │  Fast refresh on both      │
        └────────────────────────────┘
```

- Host connects to Remote's dev server via `http://localhost:5000/remoteEntry.js`
- **Both apps have full HMR** — changes reflect instantly
- Remote can be developed standalone with its own `index.html`

### Production Mode (Single Nginx)

```
┌─────────────────────────────────────┐
│           Nginx Container           │
│  ┌───────────────────────────────┐  │
│  │  /usr/share/nginx/html/       │  │
│  │  ├── index.html (host)        │  │
│  │  ├── assets/ (host chunks)    │  │
│  │  └── mf/                      │  │
│  │      ├── remoteEntry.js       │  │
│  │      └── assets/ (remote)     │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

- Both apps bundled into single Nginx container
- Host's `remoteEntry.js` URL changes to relative `/mf/remoteEntry.js`
- **No Node.js runtime needed** — pure static serving

---

## 🎨 CSS Isolation Strategy

### Problem: Style Conflicts

When hosting multiple microfrontends, CSS can leak between applications:
- Global resets affect other apps
- Class name collisions cause unexpected styles
- Different CSS-in-JS runtimes may conflict

### Solution: Prefixed Tailwind

**Host (MUI)**: Uses Emotion CSS-in-JS — scoped by default

**Remote (Tailwind)**: All utilities prefixed with `tw-`

```tsx
// Remote's Tailwind classes are prefixed
<div className="tw-bg-blue-500 tw-text-white tw-p-4">
  No conflict with host's styles!
</div>
```

**Tailwind Config:**
```js
module.exports = {
  prefix: 'tw-',
  corePlugins: {
    preflight: false  // Disable global reset
  }
}
```

---

## 🌟 When to Use This Pattern

| Scenario | This Pattern Helps? |
|----------|---------------------|
| Multiple teams need independent deployments | ✅ Yes |
| Gradual migration from monolith | ✅ Yes |
| Different styling systems needed | ✅ Yes |
| Shared authentication/state | ✅ Yes |
| Simple blog or marketing site | ❌ Overkill |
| Small team, single codebase | ❌ Overkill |

**See [docs/USE-CASES.md](docs/USE-CASES.md) for detailed scenarios.**

---

## 📈 Future Migration Path

When you need to scale to separate deployments:

```bash
# 1. Deploy remote to its own server
# https://remote.example.com/remoteEntry.js

# 2. Update host's vite.config.ts
remotes: {
  {
          name: "remote",
          type: "module",
          entry: "http://localhost:5000/remoteEntry.js"
  }
}

# 3. Rebuild host — NO CODE CHANGES!
pnpm build:host
```

---

## 📚 Documentation

- **[Architecture Guide](docs/ARCHITECTURE.md)** — Deep dive into design decisions
- **[Local Development](docs/LOCAL-DEVELOPMENT.md)** — HMR setup and debugging
- **[Production Deployment](docs/PRODUCTION-DEPLOYMENT.md)** — Docker, Nginx, CI/CD
- **[Use Cases](docs/USE-CASES.md)** — When this pattern fits your needs
- **[Contributing](CONTRIBUTING.md)** — How to contribute to this project

---

## 🛠️ Tech Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| [Vite](https://vitejs.dev/) | Build tool with native ESM | 7.x |
| [React](https://react.dev/) | UI framework | 19.x |
| [TypeScript](https://www.typescriptlang.org/) | Type safety | 5.x |
| [@module-federation/vite](https://github.com/module-federation/vite) | Module Federation for Vite | 1.9.x |
| [Material-UI](https://mui.com/) | Host UI components | 6.x |
| [Tailwind CSS](https://tailwindcss.com/) | Remote utility CSS | 3.x |
| [PNPM](https://pnpm.io/) | Package manager | 10.x |
| [Docker](https://www.docker.com/) | Containerization | Latest |
| [Nginx](https://nginx.org/) | Production server | 1.27 |

---

## 📄 License

MIT © [Anurag Kumar](https://github.com/anuragkr29)

---

## 🤝 Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md) for details.

---

**⭐ If this project helped you, consider giving it a star!**
