# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current state: scaffold only

This repo currently contains **only an empty directory tree** (`.gitkeep` placeholders) plus the three spec PDFs at the root. None of the application code, root config files (`package.json`, `pnpm-workspace.yaml`, `turbo.json`, `biome.json`, `tsconfig.base.json`), or `.husky` hooks described below exist yet — they are the agreed target structure, not present code. When asked to "build module X," you are creating it from scratch against the spec, not modifying existing code. The spec PDFs (`Integradora 9C.docx.pdf`, `Avance 1 Integradora Ulises.pdf`, `SetUp General.pdf`) are the source of truth for requirements and the intended layout.

## What this project is

**SCIPOS — Sistema Comercial Integral**: a commercial/POS platform (productos, clientes, cotizaciones, ventas POS, caja, compras, comprobante PDF simulado, reportes). University integrator project (UTEZ, team "LOBOSOFT", course *Desarrollo Web Integral*). Methodology: **Shape Up** (pitch / appetite / scopes / circuit breaker — see `Avance 1` PDF §12).

The defining requirement (graded above everything else): **dynamic per-module, per-action privileges**, not just roles. A user sees, hides, enables, or is blocked from each function based on privileges assigned dynamically. Roles: Administrador, Vendedor, Cajero, Supervisor. **Frontend hiding is never sufficient — the backend must validate every protected action** (RF-05/RF-06, RNF-15).

## Mandatory architecture (non-negotiable, from the brief)

| Layer | Requirement |
|-------|-------------|
| Overall | SOFEA |
| Frontend | Microfrontends as separate apps/components — Next.js + TypeScript + MUI |
| Backend | Microservices — NestJS (Prisma or TypeORM) |
| Database | PostgreSQL (one schema/set of tables per service, by responsibility) |
| Auth | JWT, roles **and** dynamic privileges; JWKS for service-to-service |
| API docs | OpenAPI / Swagger (Scalar / ApiDog acceptable) |
| Repo | pnpm monorepo + Turborepo |

SOLID is a required, justified deliverable. Inter-service comms are primarily REST; events (Kafka) and Redis cache are "advanced" optional tiers. Data flow: `Clients (Web/Mobile) → App Shell / Microfrontends → API Gateway → Microservices → Postgres + Redis → Kafka`.

## Planned monorepo layout

```
apps/
  backend/
    gateway/        # NestJS API Gateway — routing, auth, rate limiting (HTTP entry point)
    services/       # domain microservices (auth, tenant, comercial/cotizaciones-ventas,
                    #   inventario-productos, caja, compras, reportes, comprobantes)
    commons/        # backend-only shared lib: contracts (versioned DTOs/events),
                    #   observability, security (JWKS client, guards, crypto), utils
    test/           # backend integration tests
  frontend/
    web-shell/      # Next.js host — navigation, auth, loads microfrontends (Module Federation)
    commons/        # frontend-only: atomic UI, hooks, state (RTK/RTK Query), API clients, utils
    *-front/        # domain microfrontends (e.g. productos-mf, cotizaciones-mf, billing-mf)
  mobile/           # Flutter app-shell + plugins (only if mobile is in scope)
  addons/           # local dev tooling (e.g. project-dev-stack CLI for `pnpm dev:stack`)
  e2e/              # cross-app end-to-end tests
packages/           # cross-domain shared (shared-schemas, shared-protos, shared-devtools) — explicit only
docs/               # 00-overview, 01-architecture (c4/, decisions/ ADRs, standards/), 02-api, 03-runbooks, 04-product
infra/              # docker/{compose,images,scripts}, k8s, ci/jenkins, observability (otel/prometheus/grafana)
agents/             # AI+human governance: developmentflow.md, rules/, checklists/, prompts/, templates/
scripts/            # repo automation (bootstrap, dev, lint, test, release, security-suite)
stubs/              # scaffolding templates (e.g. next-ts/)
```

`commons` is split deliberately: `apps/frontend/commons` and `apps/backend/commons` never cross. Use `packages/` only for genuinely cross-domain sharing, and make the dependency explicit.

## Commands (intended — wire these up when creating root config)

```
pnpm install      # install deps + generate Prisma clients in services
pnpm dev          # run all dev targets via Turborepo
pnpm dev:stack    # bring up the full local stack (compose + apps)
pnpm build        # build all packages
pnpm lint         # Biome lint across the monorepo
pnpm test         # test across the monorepo
```

Use **pnpm** (workspaces), not npm. Node ≥ 20 (`.nvmrc`). Turborepo orchestrates cross-package tasks; lint/format is **Biome** (`biome.json`), not ESLint/Prettier. Run a single package's task by filtering, e.g. `pnpm --filter <pkg> test` or `turbo run test --filter=<pkg>`.

### Local infrastructure (from SetUp General)

```bash
# Postgres
docker run --name scipos-db -e POSTGRES_USER=root -e POSTGRES_PASSWORD=root \
  -e POSTGRES_DB=scipos -p 5432:5432 -d postgres:16
# Redis
docker run --name scipos-redis -p 6379:6379 -d redis:5 redis-server --requirepass root
```

## Conventions

- **Commits** are validated by commitlint (Conventional Commits) via the `commit-msg` husky hook; `pre-commit` runs lint. Existing history uses Spanish commit subjects (e.g. `chore: commit inicial...`).
- **Language**: requirements, docs, and UI copy are Spanish (es-MX). `scripts/es-mx-copy-scan.sh` is intended to enforce copy.
- **Branching**: the team must document base branches (e.g. `main`/`dev`/`qa`), PR-based integration, and a work-branch naming format (see `Integradora 9C` PDF "Estrategia de ramas"). `main` is currently the only branch.
- **API-first**: write the OpenAPI contract (`docs/02-api/openapi/`) before implementing an endpoint; versioned DTOs/events live in `apps/backend/commons/contracts`.
- New modules/services should follow `stubs/` templates and the module contract in `agents/templates/` rather than ad-hoc structure.

## Priority scope (Shape Up circuit breaker)

If time is short, the protected core to ship first is: **auth + dynamic privileges → productos → clientes → cotizaciones → conversión cotización-a-venta**. POS/caja, comprobante PDF, reportes, and compras come after. Don't let the privilege system degrade — it's the graded centerpiece.
