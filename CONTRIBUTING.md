# Contributing Guide

Thank you for your interest in contributing to the Vite Module Federation Monorepo! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)

---

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code.

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what is best for the community

---

## Getting Started

### Prerequisites

- Node.js 20+ (LTS)
- PNPM 9.x
- Docker (optional, for testing production builds)
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/vite-module-federation-monorepo.git
cd vite-module-federation-monorepo
```

3. Add upstream remote:

```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/vite-module-federation-monorepo.git
```

---

## Development Setup

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev:remote  # Terminal 1
pnpm dev:host    # Terminal 2

# Run tests
pnpm test

# Build for production
pnpm build

# Test Docker build
docker build -t test-build .
docker run -p 8080:80 test-build
```

---

## Making Changes

### 1. Create a Branch

```bash
# Update main
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Follow the [coding standards](#coding-standards)
- Write tests if applicable
- Update documentation if needed

### 3. Test Your Changes

```bash
# Run all checks
pnpm build
pnpm lint
pnpm test

# Test Docker build
docker build -t test-build .
```

### 4. Commit Your Changes

Follow the [commit message guidelines](#commit-message-guidelines).

---

## Pull Request Process

1. **Update your branch** with the latest upstream changes:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push your changes** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request** on GitHub with:
   - Clear title describing the change
   - Description of what and why
   - Link to related issues
   - Screenshots if UI changes

4. **Address review feedback** promptly

5. **Merge** after approval and CI passes

---

## Coding Standards

### TypeScript

- Use strict TypeScript (`strict: true`)
- Prefer interfaces over type aliases for object shapes
- Use explicit return types for public functions
- Avoid `any` — use `unknown` with type guards

```typescript
// ✅ Good
interface UserProps {
  name: string;
  age: number;
}

function getUser(id: string): Promise<UserProps> {
  // ...
}

// ❌ Avoid
type User = any;
```

### React

- Use functional components
- Use hooks for state and side effects
- Keep components small and focused
- Use meaningful component names

```tsx
// ✅ Good
function UserCard({ name, email }: UserCardProps) {
  return (
    <div className="user-card">
      <h2>{name}</h2>
      <p>{email}</p>
    </div>
  );
}

// ❌ Avoid
function Comp(props: any) {
  // large, unfocused component
}
```

### CSS

- **Host**: Use MUI's styling system
- **Remote**: Use Tailwind with `tw-` prefix
- No global CSS that could leak

```tsx
// Remote component
<div className="tw-bg-blue-500 tw-text-white tw-p-4">
  Prefixed Tailwind classes
</div>
```

### File Organization

```
apps/
├── host/src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route-level components
│   ├── hooks/          # Custom hooks
│   ├── utils/          # Helper functions
│   └── types/          # TypeScript types
├── remote/src/
│   └── (same structure)
└── shared/src/
    ├── hooks/          # Shared hooks
    ├── utils/          # Shared utilities
    └── types/          # Shared types
```

---

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, semicolons) |
| `refactor` | Code change that neither fixes nor adds |
| `perf` | Performance improvement |
| `test` | Adding/updating tests |
| `chore` | Maintenance tasks |
| `ci` | CI/CD changes |

### Scopes

- `host` — Host application changes
- `remote` — Remote application changes
- `shared` — Shared library changes
- `docs` — Documentation changes
- `docker` — Docker/Nginx changes
- `deps` — Dependency updates

### Examples

```bash
# Feature
feat(remote): add user profile component

# Bug fix
fix(host): resolve routing issue on page refresh

# Documentation
docs: update local development guide

# Refactor
refactor(shared): simplify auth hook implementation

# Dependencies
chore(deps): update vite to v5.4.0
```

### Commit Message Rules

1. **Subject line** max 72 characters
2. **Use imperative mood**: "add" not "added" or "adds"
3. **No period** at the end of subject
4. **Separate subject** from body with blank line
5. **Body** explains what and why, not how

---

## Questions?

- Open a [Discussion](https://github.com/anuragkr29/vite-module-federation-monorepo/discussions) for general questions
- Open an [Issue](https://github.com/anuragkr29/vite-module-federation-monorepo/issues) for bugs or feature requests

Thank you for contributing! 🙏
