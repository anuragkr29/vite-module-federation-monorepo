# ---------- Build Stage ----------
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./

# Install pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy all workspace packages
COPY apps/ ./apps/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build in correct order: shared -> remote -> host
RUN pnpm --filter @mfe/shared build
RUN pnpm --filter @mfe/remote build
RUN pnpm --filter @mfe/host build

# List build outputs for verification
RUN echo "=== Remote build output ===" && \
    ls -la /app/apps/remote/dist/ && \
    echo "=== Host build output ===" && \
    ls -la /app/apps/host/dist/

# ---------- Runtime Stage (Nginx only) ----------
FROM nginx:1.27-alpine AS runtime

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy host dist to nginx root
COPY --from=builder /app/apps/host/dist /usr/share/nginx/html

# Copy remote MF assets to /mf subdirectory
COPY --from=builder /app/apps/remote/dist /usr/share/nginx/html/mf

# Verify files are in place
RUN echo "=== Nginx html directory ===" && \
    ls -la /usr/share/nginx/html/ && \
    echo "=== Nginx mf directory ===" && \
    ls -la /usr/share/nginx/html/mf/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
