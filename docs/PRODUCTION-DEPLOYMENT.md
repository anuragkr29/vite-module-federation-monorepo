# Production Deployment Guide

> Potential guide for deploying the Microfrontend application to production using Docker and Nginx. Modifications will be required

## Table of Contents

- [Overview](#overview)
- [Why Nginx for Production](#why-nginx-for-production)
- [Docker Configuration](#docker-configuration)
- [Nginx Configuration Deep Dive](#nginx-configuration-deep-dive)
- [Build Process](#build-process)
- [Deployment Options](#deployment-options)
- [CI/CD Integration](#cicd-integration)
- [Monitoring and Logging](#monitoring-and-logging)
- [Scaling Considerations](#scaling-considerations)

---

## Overview

### Production Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Production Deployment                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                  Docker Container                       │   │
│   │  ┌───────────────────────────────────────────────────┐  │   │
│   │  │               Nginx 1.27-alpine                   │  │   │
│   │  │                                                   │  │   │
│   │  │  /usr/share/nginx/html/                           │  │   │
│   │  │  ├── index.html        ← Host SPA entry           │  │   │
│   │  │  ├── assets/           ← Host JS/CSS bundles      │  │   │
│   │  │  └── mf/                                          │  │   │
│   │  │      └── assets/       ← Remote MF assets         │  │   │
│   │  │          ├── remoteEntry.js                       │  │   │
│   │  │          └── *.js, *.css                          │  │   │
│   │  └───────────────────────────────────────────────────┘  │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              Exposed Port: 80 → Host:8080               │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Benefits of This Setup

| Benefit | Description |
|---------|-------------|
| **No Runtime Dependencies** | Pure static files, no Node.js needed |
| **Minimal Attack Surface** | Alpine Linux + Nginx only |
| **Small Image Size** | ~25MB final image |
| **High Performance** | Nginx optimized for static serving |
| **Simple Operations** | One container, one image |

---

## Why Nginx for Production

### Constraints & How Nginx Solves Them

#### Constraint 1: Security — Remote Should Not Be Directly Accessible

**Problem:** In many MFE setups, the remote can be accessed standalone, potentially exposing admin panels or internal tools.

**Nginx Solution:**
```nginx
location /mf/ {
  # Block direct HTML access
  location ~ \.html$ {
    return 404;
  }
}
```

Users cannot browse to `/mf/index.html` — they only get the JS/CSS assets through the host.

#### Constraint 2: Single Origin for Module Loading

**Problem:** Cross-origin module loading requires complex CORS setup and increases latency.

**Nginx Solution:**
```nginx
location / {
  # Host SPA
  root /usr/share/nginx/html;
}

location /mf/ {
  # Remote assets - same origin!
  root /usr/share/nginx/html;
}
```

Both served from same domain = no CORS issues, faster loading.

#### Constraint 3: SPA Routing

**Problem:** Direct navigation to `/remote-app` returns 404 because the file doesn't exist.

**Nginx Solution:**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

All unknown routes fallback to `index.html` where React Router handles them.

#### Constraint 4: Caching Strategy

**Problem:** Users may see stale content after deployments.

**Nginx Solution:**
```nginx
# Always fetch fresh HTML
location / {
  add_header Cache-Control "no-cache, no-store, must-revalidate";
}

# Cache hashed assets forever
location ~* \.(js|css)$ {
  add_header Cache-Control "public, immutable";
  expires 1y;
}
```

#### Constraint 5: ES Module Support

**Problem:** `.js` files need correct MIME type.

**Nginx Solution:**
```nginx
types {
  application/javascript js;
}

location ~* \.js$ {
  add_header 'Content-Type' 'application/javascript';
}
```

---

## Docker Configuration

### Multi-Stage Dockerfile

```dockerfile
# ---------- Build Stage ----------
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first (cache optimization)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./

# Enable PNPM
RUN corepack enable && corepack prepare pnpm@10.26.2 --activate

# Copy source code
COPY apps/ ./apps/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build in correct order
RUN pnpm --filter @mfe/shared build
RUN pnpm --filter @mfe/remote build
RUN pnpm --filter @mfe/host build

# ---------- Runtime Stage ----------
FROM nginx:1.27-alpine AS runtime

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy host dist
COPY --from=builder /app/apps/host/dist /usr/share/nginx/html

# Copy remote dist to /mf subdirectory
COPY --from=builder /app/apps/remote/dist /usr/share/nginx/html/mf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Build Commands

```bash
# Build the Docker image
docker build -t vite-mfe-monorepo .

# Run the container
docker run -d -p 8080:80 --name mfe-app vite-mfe-monorepo

# View logs
docker logs -f mfe-app

# Stop and remove
docker stop mfe-app && docker rm mfe-app
```

### Docker Compose (Optional)

```yaml
# docker-compose.yml
version: '3.8'

services:
  mfe-app:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## Nginx Configuration Deep Dive

### Full nginx.conf Explained

```nginx
worker_processes 1;  # Single process for container

events {
  worker_connections 1024;  # Max concurrent connections
}

http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;
  
  # ES Module MIME type
  types {
    application/javascript mjs;
  }
  
  sendfile on;
  keepalive_timeout 65;

  # Gzip compression (30-70% size reduction)
  gzip on;
  gzip_vary on;
  gzip_min_length 1024;
  gzip_types text/plain text/css text/xml text/javascript 
             application/x-javascript application/xml+rss 
             application/javascript application/json;

  server {
    listen 80;
    server_name localhost;

    # ========================================
    # HOST SPA - Main application entry point
    # ========================================
    location / {
      root /usr/share/nginx/html;
      
      # SPA fallback: unknown routes → index.html
      try_files $uri $uri/ /index.html;
      
      # Don't cache HTML (always fetch fresh)
      add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # ========================================
    # REMOTE MODULE FEDERATION ASSETS
    # ========================================
    location /mf/ {
      root /usr/share/nginx/html;
      
      # Security: disable directory listing
      autoindex off;
      
      # CORS headers (needed for module loading)
      add_header 'Access-Control-Allow-Origin' '*' always;
      add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS' always;
      add_header 'Access-Control-Allow-Headers' 'Origin, Content-Type, Accept' always;
      
      # Security: block direct HTML access
      location ~ \.html$ {
        return 404;
      }
      
      # ES Module files
      location ~* \.js$ {
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Content-Type' 'application/javascript' always;
        add_header Cache-Control "public, immutable" always;
        expires 1y;
      }
      
      # Static assets with long cache
      location ~* \.(css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header Cache-Control "public, immutable" always;
        expires 1y;
      }
    }

    # Security: deny access to hidden files
    location ~ /\.ht {
      deny all;
    }
  }
}
```

---

## Build Process

### Build Order is Critical

```bash
# 1. Shared library (no dependencies)
pnpm build:shared

# 2. Remote (depends on shared)
pnpm build:remote

# 3. Host (depends on shared + needs to know remote's manifest)
pnpm build:host
```

### What Each Build Produces

**Shared:**
```
apps/shared/dist/
├── index.js       # CommonJS
└── index.d.ts     # TypeScript types
```

**Remote:**
```
apps/remote/dist/
├── remoteEntry.js           # Federation entry
└── assets/
    ├── __federation_expose_App-*.js
    ├── __federation_shared_*.js
    └── index-*.css               # Tailwind styles
```

**Host:**
```
apps/host/dist/
├── index.html                    # SPA entry
└── assets/
    ├── index-*.js                # Main bundle
    └── index-*.css               # MUI styles
```

---

## Deployment Options

### Option 1: Docker Directly

```bash
# Build and push to registry
docker build -t myregistry/vite-mfe:v1.0.0 .
docker push myregistry/vite-mfe:v1.0.0

# Deploy on server
docker pull myregistry/vite-mfe:v1.0.0
docker run -d -p 80:80 myregistry/vite-mfe:v1.0.0
```

### Option 2: Kubernetes

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vite-mfe
spec:
  replicas: 3
  selector:
    matchLabels:
      app: vite-mfe
  template:
    metadata:
      labels:
        app: vite-mfe
    spec:
      containers:
      - name: vite-mfe
        image: myregistry/vite-mfe:v1.0.0
        ports:
        - containerPort: 80
        resources:
          limits:
            memory: "128Mi"
            cpu: "100m"
---
apiVersion: v1
kind: Service
metadata:
  name: vite-mfe-service
spec:
  selector:
    app: vite-mfe
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```

### Option 3: Cloud Platforms

**AWS (ECS/Fargate):**
- Push to ECR
- Create ECS service with ALB

**Google Cloud Run:**
```bash
gcloud run deploy vite-mfe \
  --image gcr.io/PROJECT/vite-mfe \
  --port 80 \
  --allow-unauthenticated
```

**Azure Container Apps:**
```bash
az containerapp create \
  --name vite-mfe \
  --resource-group mygroup \
  --image myregistry.azurecr.io/vite-mfe:v1.0.0 \
  --target-port 80 \
  --ingress external
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and Push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - build
  - deploy

build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

deploy:
  stage: deploy
  script:
    - kubectl set image deployment/vite-mfe vite-mfe=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
```

---

## Monitoring and Logging

### Nginx Access Logs

```nginx
http {
  log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                  '$status $body_bytes_sent "$http_referer" '
                  '"$http_user_agent"';
  
  access_log /var/log/nginx/access.log main;
  error_log /var/log/nginx/error.log warn;
}
```

### Health Check Endpoint

```nginx
location /health {
  access_log off;
  return 200 "healthy\n";
  add_header Content-Type text/plain;
}
```

### Docker Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost/health || exit 1
```

---

## Scaling Considerations

### Horizontal Scaling

The stateless nature of this deployment makes scaling simple:

```bash
# Docker Swarm
docker service scale mfe-app=5

# Kubernetes
kubectl scale deployment vite-mfe --replicas=5
```

### CDN Integration

For global distribution, place a CDN in front:

```
Users → CDN (CloudFront/Cloudflare) → Nginx Container
              ↓
         Cache static assets
         (/assets/*, /mf/assets/*)
```

### Load Balancing

With multiple containers, use a load balancer:

```
         ┌─────────────────┐
         │  Load Balancer  │
         └────────┬────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼───┐    ┌───▼───┐    ┌───▼───┐
│ Pod 1 │    │ Pod 2 │    │ Pod 3 │
└───────┘    └───────┘    └───────┘
```

---

## Next Steps

- [Architecture Guide](ARCHITECTURE.md) — Understanding design decisions
- [Local Development](LOCAL-DEVELOPMENT.md) — Setting up HMR
- [Use Cases](USE-CASES.md) — When to use this pattern
