# OJA Barrow

A modern full-stack monorepo for building the OJA Barrow web platform, powered by **Next.js**, **TypeScript**, **Supabase/PostgreSQL**, and a shared package architecture.

---

## Table of Contents

- [Overview](#overview)
- [Goals](#goals)
- [Architecture at a Glance](#architecture-at-a-glance)
- [Monorepo Structure](#monorepo-structure)
- [Technology Stack](#technology-stack)
- [How It Works](#how-it-works)
  - [Web App (`apps/web`)](#web-app-appsweb)
  - [Shared Logic (`packages/shared`)](#shared-logic-packagesshared)
  - [UI Library (`packages/ui`)](#ui-library-packagesui)
  - [Database Layer (`packages/database`)](#database-layer-packagesdatabase)
  - [Config Package (`packages/config`)](#config-package-packagesconfig)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Turbo Pipeline](#turbo-pipeline)
- [Database Workflow](#database-workflow)
- [Development Workflow](#development-workflow)
- [Code Quality & Conventions](#code-quality--conventions)
- [Deployment Notes](#deployment-notes)
- [Troubleshooting](#troubleshooting)
- [Security Notes](#security-notes)
- [Roadmap Suggestions](#roadmap-suggestions)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**OJA Barrow** is organized as a scalable monorepo that separates concerns between:

- the user-facing web experience,
- reusable UI and shared domain logic,
- and database migration/seed assets.

The repository is optimized for growth: package boundaries are explicit, internal dependencies are workspace-managed, and builds are orchestrated through Turborepo.

---

## Goals

This project structure supports:

1. **Fast iteration** in local development.
2. **Code reuse** across multiple packages/apps.
3. **Typed contracts** between UI, shared logic, and data layers.
4. **Clear separation** of product code and infrastructure concerns.
5. **Future expansion** to additional apps/services without refactoring the whole repo.

---

## Architecture at a Glance

- **Monorepo manager:** `pnpm` workspaces
- **Task runner/caching:** `turbo`
- **Primary app:** Next.js (App Router-ready stack)
- **Language baseline:** TypeScript
- **Database:** PostgreSQL (Supabase integration + SQL migrations/seeds)
- **Validation/forms/UI utility ecosystem:** Zod, React Hook Form, CVA, clsx, tailwind-merge, Lucide

---

## Monorepo Structure

```text
.
├─ apps/
│  └─ web/                    # Next.js web application
├─ packages/
│  ├─ config/                 # Centralized/shared config package (scaffolded)
│  ├─ database/               # Migrations, seed SQL, DB source package
│  ├─ shared/                 # Shared TS logic/types/utilities
│  └─ ui/                     # Reusable UI component package
├─ package.json               # Root scripts + dev toolchain
├─ pnpm-workspace.yaml        # Workspace package globs
├─ turbo.json                 # Turborepo task graph
└─ README.md
```

---

## Technology Stack

### Core Platform

- **TypeScript**
- **Node.js + pnpm**
- **Turborepo**

### Frontend (`apps/web`)

- **Next.js 16**
- **React 19**
- **Tailwind CSS 4**
- **ESLint (Next config)**

### Form & Validation

- **react-hook-form**
- **@hookform/resolvers**
- **zod**

### UI Utilities

- **class-variance-authority**
- **clsx**
- **tailwind-merge**
- **lucide-react**

### Backend / Data

- **@supabase/supabase-js**
- **@supabase/ssr**
- **PLpgSQL / SQL migrations and seeds**

---

## How It Works

### Web App (`apps/web`)

The primary application package where:

- route handling, rendering, and interaction logic live,
- internal workspace packages are consumed:
  - `@oja-barrow/database`
  - `@oja-barrow/shared`
  - `@oja-barrow/ui`
- Supabase client/SSR integration is wired for authenticated and data-driven flows.

---

### Shared Logic (`packages/shared`)

A reusable package intended for cross-cutting concerns such as:

- DTOs / domain types,
- validation schemas,
- utility functions,
- constants and helper abstractions.

This package helps avoid duplication and keeps app-level code lean.

---

### UI Library (`packages/ui`)

A reusable component system package intended to encapsulate:

- primitive and composed UI components,
- style variants and design tokens,
- visual consistency for all consuming apps.

This package can become the single source of truth for design system assets.

---

### Database Layer (`packages/database`)

Contains data-layer artifacts:

- `migrations/` for schema evolution,
- `seed.sql` for deterministic local/dev seed data,
- package source for database-facing utilities and contracts.

This setup enables repeatable environment provisioning and controlled schema changes.

---

### Config Package (`packages/config`)

A placeholder package for standardized, sharable config:

- lint config,
- TS config bases,
- Tailwind/PostCSS presets,
- runtime env contract helpers.

Useful as the repo scales and config duplication becomes costly.

---

## Prerequisites

Install these before starting:

- **Node.js** (LTS recommended)
- **pnpm** (repo is pinned to `pnpm@10.33.2`)
- (Optional but recommended) **Supabase CLI** for local DB workflows
- Git

---

## Quick Start

### 1) Clone the repository

```bash
git clone https://github.com/Ebendttl/oja-barrow.git
cd oja-barrow
```

### 2) Install dependencies

```bash
pnpm install
```

### 3) Configure environment variables

Create environment files (typically in `apps/web/`) and provide required values (see [Environment Variables](#environment-variables)).

### 4) Start development

```bash
pnpm dev
```

This runs Turborepo’s `dev` pipeline, which starts package-level dev tasks as configured.

---

## Environment Variables

The project uses Supabase dependencies, so at minimum, configure:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- (optional server-side secret variables depending on server actions/API use)

Suggested convention:

- `apps/web/.env.local` for local development
- CI/hosting provider secrets for non-local environments

> Keep all secrets out of version control. Never commit private keys.

---

## Available Scripts

From root `package.json`:

### `pnpm dev`

Runs:

```bash
turbo run dev
```

Starts all relevant development processes in workspace packages.

### `pnpm build`

Runs:

```bash
turbo run build
```

Builds all packages/apps according to dependency graph and caching rules.

### `pnpm lint`

Runs:

```bash
turbo run lint
```

Lints the workspace.

### `pnpm format`

Runs Prettier write mode for TypeScript/TSX/Markdown files:

```bash
prettier --write "**/*.{ts,tsx,md}"
```

---

## Turbo Pipeline

Defined in `turbo.json`:

- `build`
  - depends on upstream package builds (`^build`)
  - caches output (`.next/**`, `dist/**`, excluding `.next/cache/**`)
- `dev`
  - cache disabled
  - persistent process mode
- `lint`
  - depends on upstream builds

This keeps multi-package builds deterministic and efficient as the monorepo grows.

---

## Database Workflow

With `packages/database` containing migrations and seed SQL, a typical flow is:

1. Apply latest migrations to local DB.
2. Run or load `seed.sql` for deterministic baseline data.
3. Start app and validate end-to-end behavior against expected schema/data state.

Recommended best practices:

- make migrations additive and reversible where possible,
- keep seed data stable and idempotent,
- document schema-breaking changes in PR descriptions.

---

## Development Workflow

1. Create a feature branch.
2. Implement changes in the relevant package(s).
3. Run:

```bash
pnpm lint
pnpm build
```

4. Validate runtime behavior via `pnpm dev`.
5. Open a PR with:
   - architectural context,
   - migration notes (if applicable),
   - testing/verification steps.

---

## Code Quality & Conventions

Recommended repo conventions:

- Strict typing over `any`.
- Co-locate domain logic in `shared` and UI primitives in `ui`.
- Keep data access concerns separated from rendering concerns.
- Prefer schema-first validation (e.g., Zod) at boundaries.
- Keep public APIs of internal packages minimal and explicit.
- Use formatting/linting consistently before commit.

---

## Deployment Notes

At a high level:

- `apps/web` is deployable to modern Next.js-compatible hosts.
- Supabase project/environment should match deployment stage.
- Ensure build-time and runtime environment variables are configured correctly.
- Run migrations in a controlled release process before app rollout.

---

## Troubleshooting

### `pnpm install` issues

- Ensure pnpm version compatibility (`pnpm@10.33.2` pinned in root).
- Delete `node_modules` and reinstall if lockfile mismatch occurs.

### Build graph failures

- Run `pnpm build` from repo root (not from an individual package unless intentional).
- Verify all workspace package names/imports are correct (`workspace:*` links resolve only within workspace context).

### Supabase connection problems

- Confirm URL/key environment variables are set in the correct env file.
- Verify keys match the intended project/stage.

### Lint/type errors after dependency updates

- Re-run install and clear caches if needed.
- Validate TS/ESLint package version compatibility in affected package.

---

## Security Notes

- Never expose service-role or private keys in client bundles.
- Treat all user input as untrusted; validate at boundaries.
- Use row-level security and least privilege in database policies.
- Rotate keys and revoke compromised credentials promptly.

---

## Roadmap Suggestions

Potential next milestones:

- Add root-level `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`
- Add CI pipeline (lint + build + test + migration checks)
- Add package-level READMEs for `shared`, `ui`, and `database`
- Add automated schema drift checks
- Add testing strategy documentation (unit, integration, e2e)

---

## Contributing

Contributions are welcome.

1. Fork the repo.
2. Create a feature branch.
3. Commit focused changes.
4. Run quality checks.
5. Open a pull request with clear context and validation steps.

For major changes, open an issue first to discuss architecture and scope.

---

## License

This repository is licensed under the **MIT License**.  
See [`LICENSE`](./LICENSE) for full text.
