# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

**SCIPOS — Sistema Comercial Integral**: a commercial/POS platform (productos, clientes, cotizaciones, ventas POS, caja, compras, comprobante PDF simulado, reportes). University integrator project (UTEZ, team "LOBOSOFT", course *Desarrollo Web Integral*). Methodology: **Shape Up** (pitch / appetite / scopes / circuit breaker — see `Avance 1` PDF §12).

The defining requirement (graded above everything else): **dynamic per-module, per-action privileges**, not just roles. A user sees, hides, enables, or is blocked from each function based on privileges assigned dynamically. Roles: Administrador, Vendedor, Cajero, Supervisor. **Frontend hiding is never sufficient — the backend must validate every protected action** (RF-05/RF-06, RNF-15). Both halves exist now: the backend `seguridad` service is the source of truth and every protected endpoint is guarded; the frontend reflects what the API says.

The spec PDFs in `docs/pdfs/` (`Integradora 9C.docx.pdf`, `Avance 1 Integradora Ulises.pdf`, `SetUp General.pdf`) are the source of truth for requirements. `docs/readmes/avance-2-plan-frontend.md` produced the frontend; `docs/readmes/avance-3-plan-backend.md` is the active plan for the backend (task split per team member); `docs/readmes/GUIA-DEL-SISTEMA.md` is the team-facing functional guide; the root `README.md` is the local-dev startup runbook.

## Current state

The **frontend (Avance 2) is built and runnable**, and the **backend base (Avance 3) is in place**: gateway, `seguridad` service, `backend-commons`, a service template, and local Docker infra. The domain services (`productos` 4002, `clientes` 4003, `cotizaciones` 4004, `ventas-caja` 4005) are **not built yet** — each team member builds their own per `docs/readmes/avance-3-plan-backend.md`, copying `example-service`. Mobile is not started. `pnpm-workspace.yaml` includes `apps/frontend/*`, `apps/backend/*`, `apps/backend/services/*`, and `packages/*`.

### What exists today (`apps/frontend/`)

- **`web-shell/`** (`@scipos/web-shell`, port 3001) — the host app (Next.js App Router). `AppShell` = Topbar + Sidebar + content area; `src/config/navegacion.ts` is the single source for the sidebar menu (each module's route, icon, and required privilege). Routes: `/inicio` (landing with business-overview stat cards and `@mui/x-charts` bar charts comparing precioCompra vs precioVenta), `/dashboard` (role-reactive stat cards), `/productos`, `/clientes`, `/cotizaciones`, `/pos`, `/compras` (the POS in `modo="compra"`, guarded by `compras:ver` — Admin/Supervisor only), `/caja`.
- **`commons/`** (`@scipos/frontend-commons`) — the Design System and shared library. **All shared frontend code is imported from here**, via subpath exports: `@scipos/frontend-commons` (barrel), `/theme`, `/permisos`, `/components`, `/feedback`, `/mocks`. It is a source-only package (`main`/`types` point at `src/index.ts`) consumed through Next's `transpilePackages` — there is no build step for it. `/feedback` provides `ToastProvider`/`useToast` (top-right snackbars: exito=green/check, error=red/x, info=blue/!) and `confirmar()`/`alertaExito()`/`alertaError()` (SweetAlert2). The barrel also exports `SkeletonTabla`, the standard loading placeholder to render while a view waits for its data.
- **`example-front/`** (`@scipos/example-front`, port 3002) — reference template. New `<dominio>-front/` apps are created by copying this one.
- **`productos-front/`** (`@scipos/productos-front`, port 3003) — RF-07/08/09: `CatalogoProductos` with search, estado/tipo filters, create/edit dialog (lote, caducidad, **precioCompra + precioVenta**, real-time input validation), soft-delete toggle, and hard delete (Admin-only `productos:eliminar`, confirm + toast). Data from `PRODUCTOS_MOCK`.
- **`clientes-front/`** (`@scipos/clientes-front`, port 3004) — RF-10/11/12: CRUD + activate/deactivate + hard delete (`clientes:eliminar`), and a detail dialog with the client's cotizaciones/ventas history in tabs, guarded by `clientes:*`. Phone input enforces 10 digits in real time. Seeds from `CLIENTES_MOCK`.
- **`cotizaciones-front/`** (`@scipos/cotizaciones-front`, port 3005) — RF-13→17: create quote, list/filter, delete (`cotizaciones:eliminar`), and the **BORRADOR → ENVIADA → VENDIDA** lifecycle (buttons "Marcar como enviada" and "Convertir a venta"), guarded by `cotizaciones:*` (incl. `cotizaciones:enviar`, `cotizaciones:convertir`). State lives in a React Context; shares `COTIZACIONES_MOCK` from commons.
- **`pos-caja-front/`** (`@scipos/pos-caja-front`, port 3006) — RF-18→26: POS (cart, IVA, descuento, cancelar) **and** caja (apertura, movimientos, corte). A single `PosCajaPage` serves `/pos`, `/compras` and `/caja` via `defaultTab`/`hideTabs`/`modo` props: `modo="venta"` (default) sells at precioVenta and decrements stock (requires an open caja); `modo="compra"` buys at precioCompra, increments stock, and does not require the caja. Sensitive actions guarded by `pos:*` / `caja:*`. It keeps its **own local `Producto` model and mocks** in `src/mocks/posData.ts` (deliberately not unified with commons — do not merge them).

**Integration pattern**: `web-shell` embeds each domain microfrontend by depending on it as a normal `workspace:*` package (not an iframe or module-federation remote): add the package to both `next.config.mjs`'s `transpilePackages` and `web-shell/package.json` dependencies, then import its top-level component in the route's `page.tsx` (e.g. `import { CatalogoProductos } from "@scipos/productos-front"`). Follow this same wiring for every new `*-front` module. Each `*-front` gets its own dev port (3003, 3004, 3005, 3006 … next free is 3007).

**Table-action convention**: action buttons render in fixed order **Ver (eye, `primary`) → Activar/Desactivar (toggle, `success`) → Editar (pencil, `info`) → Eliminar (trash, `error`)**, omitting the ones a module doesn't have. Delete is Admin-only (`modulo:eliminar`), always behind `confirmar()` and followed by a toast.

### What exists today (`apps/backend/`)

- **`gateway/`** (`@scipos/gateway`, port 4000) — the single HTTP entry point. Proxies `/api/<servicio>/*` to each service port (routing table + CORS origins for 3001-3006 in `src/config/servicios.ts`), forwards the `x-usuario-id` header, answers 502 JSON when a service is down. The frontend only ever talks to the gateway (`NEXT_PUBLIC_API_URL`, default `http://localhost:4000/api`).
- **`commons/`** (`@scipos/backend-commons`) — backend-only shared lib, **compiled with tsc to `dist/`** (unlike frontend commons); services consume it as `workspace:*` and turbo builds it first (`dev`/`build` depend on `^build`). Exports: `@RequierePrivilegio("modulo:accion")` / `@RequiereIdentidad()` decorators, `GuardPrivilegios`, `ModuloSeguridad.registrar()` (registers the guard globally; accepts a custom `ProveedorPrivilegios`), `ExtractorIdentidad` interface + `ExtractorIdentidadHeader` (reads `x-usuario-id`), `ClienteHttp` (inter-service REST with timeout + error mapping), `FiltroExcepcionesHttp` (standard error shape `{ estatus, mensaje, error, ruta, fecha }`), and shared contracts (`UsuarioSesion`, `ResultadoVerificacion`).
- **`services/seguridad/`** (`@scipos/seguridad-service`, port 4001, Postgres schema `seguridad`) — the source of truth for privileges. Tables: `Rol` (with `accesoTotal` for ADMINISTRADOR), `Privilegio` catalog, `RolPrivilegio`, `Usuario`, `UsuarioPrivilegio` (`concedido: true` grants / `false` revokes per user, RF-03). Effective privileges = role's + granted − revoked, cached in Redis 60s and invalidated on every assignment change. Key endpoints: `GET /usuarios` (public, feeds the frontend user selector), `GET /usuarios/:id/privilegios`, `GET /privilegios/verificar?usuarioId&privilegio` (what other services' guards call), grant/revoke per role and per user. Seed (`pnpm --filter @scipos/seguridad-service seed`) loads the privilege catalog, the role matrix (mirror of frontend `matriz.ts`) and 4 fixed users: `usuario-administrador`, `usuario-vendedor`, `usuario-cajero`, `usuario-supervisor`.
- **`services/example-service/`** (`@scipos/example-service`, template) — copy to create a domain service; its README documents the steps (rename, port, own Postgres schema via `DATABASE_URL` `?schema=`, replace the `Ejemplo` resource, seed with frontend-mock IDs, register in the gateway routing table, write the OpenAPI contract first).
- Every service follows the same stack: NestJS 11 + Prisma 7 (`@prisma/adapter-pg`) + `class-validator` + Swagger/Scalar (`/docs`, `/api-json`) + Redis (ioredis, degrades gracefully if down) + `/health`. **Gotcha:** the pg adapter does NOT read `?schema=` from the URL — `prisma.service.ts` and seeds parse it and pass `{ schema }` to `PrismaPg` explicitly; keep that pattern.
- **No auth/JWT yet (not requested)**: identity travels in the `x-usuario-id` header behind the `ExtractorIdentidad` abstraction. When JWT is requested, implement a new extractor + login endpoint; guards, controllers and services must not change.

### The privilege system (backend validates, frontend reflects)

Backend half: every sensitive endpoint carries `@RequierePrivilegio("modulo:accion")`; the global guard answers **401** without `x-usuario-id` and **403** without the privilege, consulting the `seguridad` service (other services via HTTP, `seguridad` itself via a local provider). If a frontend button is behind `can("x:y")`, its endpoint must be behind `@RequierePrivilegio("x:y")` — no exceptions.

Frontend half, in `apps/frontend/commons/src/permisos/` + `src/api/`:
- `PermisosProvider.tsx` — downloads users from `GET /seguridad/usuarios` and the active user's effective privileges from `GET /seguridad/usuarios/:id/privilegios`. The Topbar role selector switches the active **seed user**; `can()` checks the downloaded list. If the API is unreachable it falls back to the local `matriz.ts` so the UI stays navigable (`origenPermisos: "api" | "local"` tells you which).
- `clienteApi.ts` — `llamarApi("/servicio/ruta")` calls the gateway and adds `x-usuario-id` for the active user automatically; throws `ErrorApi` with the backend's Spanish `mensaje`. **All frontend API calls must go through it.**

Gate UI two ways:
```tsx
const { can } = usePermisos();
{can("productos:crear") && <Button>Nuevo</Button>}                    // imperative
<Permiso requiere="productos:crear"><Button>Nuevo</Button></Permiso>  // declarative
```
New `modulo:accion` strings are registered in the **seguridad catalog** (its seed, or `POST /privilegios`) and mirrored in `matriz.ts` (the offline fallback). Do not let this system degrade — it is the graded centerpiece.

## Commands

Run from the repo root. Use **pnpm** (workspaces), not npm. Node ≥ 20 (`.nvmrc`); package manager pinned to pnpm 11 (`packageManager` field).

```bash
pnpm install                                  # install the whole monorepo
pnpm infra:up                                 # Postgres + Redis containers (Docker must be running)
pnpm setup:backend                            # infra + build commons + prisma migrate deploy + seed (first time / reset)
pnpm dev                                      # turbo run dev — all apps at once
pnpm dev --filter @scipos/seguridad-service --filter @scipos/gateway --filter @scipos/web-shell   # minimal working set
pnpm --filter @scipos/web-shell dev           # just the host        → http://localhost:3001
pnpm --filter @scipos/example-front dev       # just the template    → http://localhost:3002
pnpm --filter @scipos/productos-front dev     # just productos       → http://localhost:3003
pnpm --filter @scipos/clientes-front dev      # just clientes        → http://localhost:3004
pnpm --filter @scipos/cotizaciones-front dev  # just cotizaciones    → http://localhost:3005
pnpm --filter @scipos/pos-caja-front dev      # just POS + caja      → http://localhost:3006
pnpm --filter @scipos/seguridad-service dev   # seguridad service    → http://localhost:4001 (needs commons built)
pnpm --filter @scipos/gateway dev             # API gateway          → http://localhost:4000
pnpm --filter @scipos/seguridad-service prisma:migrate   # create/apply migrations (dev)
pnpm --filter @scipos/seguridad-service seed  # reseed privileges + seed users
pnpm build                                    # turbo run build (Next + Nest builds)
pnpm lint                                     # biome check .   (lint + format check, whole repo)
pnpm lint:fix                                 # biome check --write .
pnpm format                                   # biome format --write .
pnpm --filter @scipos/web-shell typecheck     # tsc --noEmit for one package
pnpm infra:down                               # stop containers (add -v manually to wipe data)
```

Backend services read a local `.env` (copy from each app's `.env.example`; not committed). Root `README.md` is the full startup runbook. Prefer `pnpm dev --filter X` (goes through turbo, builds `backend-commons` first) over `pnpm --filter X dev` for backend services when commons hasn't been built yet.

- **Lint/format is Biome** (`biome.json`), not ESLint/Prettier: 2-space indent, line width 100, double quotes, trailing commas, semicolons always, `organizeImports` on. `pnpm lint` runs at the root over everything; per-package `lint`/`typecheck` scripts exist too. Nest specifics already configured: parameter decorators enabled, and `useImportType` is **off for `apps/backend/**`** — Biome's `import type` "fix" erases classes that Nest injects (DI breaks at runtime with no compile error). Never re-enable it there.
- **No test runner is configured yet.** `pnpm test` (turbo `test` task) exists in config but no package defines a `test` script, so it is currently a no-op. Add the runner when the first tests are written.
- Turborepo orchestrates cross-package tasks (`turbo.json`); `dev`/`start` are persistent and uncached (`dev` depends on `^build` so `backend-commons` compiles first), `build` outputs `.next/**` and `dist/**`. Top-level `concurrency` is `"20"` because every dev task is persistent — raise it if the count of dev tasks approaches it.
- pnpm 11 gates dependency postinstall scripts via `allowBuilds` in `pnpm-workspace.yaml` (prisma/esbuild approved). If a new dep needs its build script, add it there instead of re-running blindly.

## Conventions

- **Commits** must follow Conventional Commits **without a scope** — `tipo: mensaje corto` (e.g. `feat: catalogo de productos con filtros`), never `tipo(scope): ...`. Enforced by the `commit-msg` husky hook (`commitlint.config.cjs`); Spanish subjects are expected (`subject-case` is disabled). Allowed types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert. The `pre-commit` hook runs `pnpm lint`. Never add Claude as co-author.
- **Language**: requirements, docs, UI copy, code comments, and identifiers are **Spanish (es-MX)** — match the surrounding code (`usePermisos`, `temaScipos`, `MATRIZ_PRIVILEGIOS`, `etiqueta`).
- **No forward-references or personal attributions in code**: comments and UI copy must never mention future phases ("avance", "se hará en backend", "prototipo") or team members' names. Describe what the code does today.
- **Branching**: `main` tracks releases, `develop` is the integration branch. Work happens on `feature/<algo>` / `fix/<algo>` / `style/<algo>` branches (e.g. `feature/clientes-gestion`, `feature/productos-catalogo`) merged into `develop` via PR.
- **New domain microfrontend**: copy `apps/frontend/example-front/`, rename the package to `@scipos/<dominio>-front`, depend on `@scipos/frontend-commons` (`workspace:*`), and wire its route into `web-shell/src/config/navegacion.ts`. Then integrate it into `web-shell` using the pattern in `productos-front` above (add as a `workspace:*` dependency of `web-shell`, list it in `next.config.mjs`'s `transpilePackages`, import its top-level component directly in the route's `page.tsx`). Don't invent ad-hoc shared UI — extend `commons` instead.
- **New microservice**: copy `apps/backend/services/example-service/` and follow its README (rename to `@scipos/<dominio>-service`, own port 4002-4005 and own Postgres schema, replace the `Ejemplo` resource, seed with the same IDs as the frontend mocks, register the route in `gateway/src/config/servicios.ts`). **Contract first**: write `docs/02-api/openapi/services/<dominio>.yaml` before implementing (follow `seguridad.yaml`). Every sensitive endpoint gets `@RequierePrivilegio`; services never read another service's schema — cross-domain data goes over REST via `ClienteHttp`.
- Shared UI components (`PageHeader`, `SearchableTable`, `SkeletonTabla`, `EstadoChip`, `EstadoCotizacionChip`, `StatCard`, `Permiso`), feedback (`useToast`, `confirmar` — from `/feedback`), mock catalog data (`PRODUCTOS_MOCK`, `CLIENTES_MOCK`, `COTIZACIONES_MOCK`), and helpers (`formatearMoneda`, `formatearFecha`, `formatearFechaConHora`, `totalCotizacion`) all live in and are re-exported from `commons`. `Producto` carries `lote`, `fechaCaducidad?`, `precioCompra`, `precioVenta` (there is no single `precio` field).

## Mandatory architecture (non-negotiable, from the brief)

| Layer | Requirement |
|-------|-------------|
| Overall | SOFEA |
| Frontend | Microfrontends as separate apps/components — Next.js + TypeScript + MUI — **in place** |
| Backend | Microservices — NestJS + Prisma — **base in place** (gateway + seguridad + commons + template); domain services pending |
| Database | PostgreSQL (one schema per service, single `scipos` DB in Docker) — **in place** |
| Auth | JWT, roles **and** dynamic privileges; JWKS for service-to-service — *privileges enforced server-side; JWT pending behind `ExtractorIdentidad`* |
| API docs | OpenAPI / Swagger with Scalar — **in place** (`/docs` per service; contracts in `docs/02-api/openapi/`) |
| Repo | pnpm monorepo + Turborepo — **in place** |

SOLID is a required, justified deliverable. Inter-service comms are primarily REST; events (Kafka) and Redis cache are "advanced" optional tiers. Data flow: `Clients (Web/Mobile) → App Shell / Microfrontends → API Gateway → Microservices → Postgres + Redis → Kafka`.

## Monorepo layout (what exists vs. target)

```
apps/
  frontend/         # EXISTS — web-shell (host), commons (Design System), example-front (template), *-front
  backend/          # BASE EXISTS
    gateway/        # EXISTS — NestJS API Gateway (port 4000): routing per service, CORS
    services/       # EXISTS: seguridad (4001), example-service (template)
                    # PENDING (one per teammate): productos 4002, clientes 4003, cotizaciones 4004, ventas-caja 4005
    commons/        # EXISTS — backend-only shared: seguridad (guard/extractor), http, contratos, utils, observabilidad
    test/           # placeholder for backend integration tests
  mobile/           # Flutter app-shell + plugins (only if mobile is in scope)
  addons/           # local dev tooling (e.g. project-dev-stack CLI for `pnpm dev:stack`)
  e2e/              # cross-app end-to-end tests
packages/           # cross-domain shared (shared-schemas, shared-protos, shared-devtools) — explicit only
docs/               # 02-api EXISTS (contracts + README); pdfs/, readmes/; rest of 0x-tree is target
infra/              # docker/compose EXISTS (docker-compose.dev.yml); k8s, ci, observability are target
agents/             # AI+human governance: developmentflow.md, rules/, checklists/, prompts/, templates/
scripts/            # repo automation (bootstrap, dev, lint, test, release, security-suite)
stubs/              # scaffolding templates (e.g. next-ts/)
```

`commons` is split deliberately: `apps/frontend/commons` and `apps/backend/commons` never cross. Use `packages/` only for genuinely cross-domain sharing, and make the dependency explicit. When building backend, write the OpenAPI contract (`docs/02-api/openapi/`) before implementing an endpoint; versioned DTOs/events live in `apps/backend/commons/contracts`.

### Local infrastructure

`infra/docker/compose/docker-compose.dev.yml` (run via `pnpm infra:up` / `pnpm infra:down`): `scipos-db` (Postgres 16, user/pass `root`/`root`, DB `scipos`, port 5432) and `scipos-redis` (Redis 5, password `root`, port 6379) — credentials per SetUp General. Each service connects with `DATABASE_URL=postgresql://root:root@localhost:5432/scipos?schema=<servicio>` and `REDIS_URL=redis://:root@localhost:6379`.

## Priority scope (Shape Up circuit breaker)

If time is short, the protected core to ship first is: **auth + dynamic privileges → productos → clientes → cotizaciones → conversión cotización-a-venta**. POS/caja, comprobante PDF, reportes, and compras come after. Don't let the privilege system degrade — it's the graded centerpiece.
