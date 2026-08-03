# AI Studio Monorepo Template

Production-ready reusable monorepo for AI SaaS projects.

## Quick Start

```bash
pnpm install
cp .env.example .env
pnpm dev
```

## Workspace

- `apps/studio` – Next.js App Router web app
- `apps/worker` – Node.js worker for long-running jobs
- `packages/core` – provider abstraction and shared types
- `packages/ui` – shared UI primitives
- `packages/api` – shared API validators/helpers

## Routes

`/`, `/playground`, `/gallery`, `/videos`, `/references`, `/prompts`, `/workflows`, `/settings`, `/docs`, `/output`

## Authentication and Deploy Targets

- Authentication: GitHub OAuth via `next-auth`
- Deploy targets: app is cloud-ready (Vercel/Render) and self-hosted ready (Docker/devcontainer + worker process)
