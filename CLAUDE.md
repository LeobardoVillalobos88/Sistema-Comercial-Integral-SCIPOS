# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

**SCIPOS — Sistema Comercial Integral**: a commercial/POS platform (productos, clientes, cotizaciones, ventas POS, caja, compras, comprobante PDF simulado, reportes). University integrator project (UTEZ, team "LOBOSOFT", course *Desarrollo Web Integral*). Methodology: **Shape Up** (pitch / appetite / scopes / circuit breaker — see `Avance 1` PDF §12).

The defining requirement (graded above everything else): **dynamic per-module, per-action privileges**, not just roles. A user sees, hides, enables, or is blocked from each function based on privileges assigned dynamically. Roles: Administrador, Vendedor, Cajero, Supervisor. **Frontend hiding is never sufficient — the backend must validate every protected action** (RF-05/RF-06, RNF-15). The frontend privilege system below is the visible half of this; the backend half does not exist yet.

The spec PDFs at the repo root (`Integradora 9C.docx.pdf`, `Avance 1 Integradora Ulises.pdf`, `SetUp General.pdf`) are the source of truth for requirements. `avance-2-plan-frontend.md` is the plan that produced the current frontend.

## Current state

The **frontend (Avance 2) is built and runnable**: the pnpm + Turborepo monorepo is wired up and `apps/frontend/` contains a working Next.js app. The **backend, mobile, and infra are not started** — the layout below under "Planned monorepo layout" is the agreed target, not present code. `pnpm-workspace.yaml` currently only includes `apps/frontend/*` and `packages/*`; backend services get added to the workspace when their avance begins.

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

### The privilege system (frontend half)

Lives in `apps/frontend/commons/src/permisos/`:
- `tipos.ts` — `Rol` union and `Privilegio` = template type `` `${modulo}:${accion}` `` (e.g. `"productos:crear"`, `"pos:descuento"`, `"caja:cerrar"`).
- `matriz.ts` — `MATRIZ_PRIVILEGIOS`: which privileges each role has (`"*"` = all, for ADMINISTRADOR). `rolTienePrivilegio(rol, priv)` evaluates it.
- `PermisosProvider.tsx` — React context. `usePermisos()` returns `{ rol, setRol, roles, can }`. The Topbar role selector calls `setRol`; modules react by showing/hiding actions.

Gate UI two ways:
```tsx
const { can } = usePermisos();
{can("productos:crear") && <Button>Nuevo</Button>}                    // imperative
<Permiso requiere="productos:crear"><Button>Nuevo</Button></Permiso>  // declarative
```
**This is currently a client-side mock**: roles are switched in the UI, not authenticated, and nothing is enforced server-side. When a module needs a new action, add the `modulo:accion` string to the relevant roles in `matriz.ts`. Do not let this system degrade — it is the graded centerpiece.

## Commands

Run from the repo root. Use **pnpm** (workspaces), not npm. Node ≥ 20 (`.nvmrc`); package manager pinned to pnpm 11 (`packageManager` field).

```bash
pnpm install                                  # install the whole monorepo
pnpm dev                                      # turbo run dev — all apps at once
pnpm --filter @scipos/web-shell dev           # just the host        → http://localhost:3001
pnpm --filter @scipos/example-front dev       # just the template    → http://localhost:3002
pnpm --filter @scipos/productos-front dev     # just productos       → http://localhost:3003
pnpm --filter @scipos/clientes-front dev      # just clientes        → http://localhost:3004
pnpm --filter @scipos/cotizaciones-front dev  # just cotizaciones    → http://localhost:3005
pnpm --filter @scipos/pos-caja-front dev      # just POS + caja      → http://localhost:3006
pnpm build                                    # turbo run build (Next builds)
pnpm lint                                     # biome check .   (lint + format check, whole repo)
pnpm lint:fix                                 # biome check --write .
pnpm format                                   # biome format --write .
pnpm --filter @scipos/web-shell typecheck     # tsc --noEmit for one package
```

- **Lint/format is Biome** (`biome.json`), not ESLint/Prettier: 2-space indent, line width 100, double quotes, trailing commas, semicolons always, `organizeImports` on. `pnpm lint` runs at the root over everything; per-package `lint`/`typecheck` scripts exist too.
- **No test runner is configured yet.** `pnpm test` (turbo `test` task) exists in config but no package defines a `test` script, so it is currently a no-op. Add the runner when the first tests are written.
- Turborepo orchestrates cross-package tasks (`turbo.json`); `dev`/`start` are persistent and uncached, `build` outputs `.next/**` and `dist/**`.

## Conventions

- **Commits** must follow Conventional Commits **without a scope** — `tipo: mensaje corto` (e.g. `feat: catalogo de productos con filtros`), never `tipo(scope): ...`. Enforced by the `commit-msg` husky hook (`commitlint.config.cjs`); Spanish subjects are expected (`subject-case` is disabled). Allowed types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert. The `pre-commit` hook runs `pnpm lint`. Never add Claude as co-author.
- **Language**: requirements, docs, UI copy, code comments, and identifiers are **Spanish (es-MX)** — match the surrounding code (`usePermisos`, `temaScipos`, `MATRIZ_PRIVILEGIOS`, `etiqueta`).
- **No forward-references or personal attributions in code**: comments and UI copy must never mention future phases ("avance", "se hará en backend", "prototipo") or team members' names. Describe what the code does today.
- **Branching**: `main` tracks releases, `develop` is the integration branch. Work happens on `feature/<algo>` / `fix/<algo>` / `style/<algo>` branches (e.g. `feature/clientes-gestion`, `feature/productos-catalogo`) merged into `develop` via PR.
- **New domain microfrontend**: copy `apps/frontend/example-front/`, rename the package to `@scipos/<dominio>-front`, depend on `@scipos/frontend-commons` (`workspace:*`), and wire its route into `web-shell/src/config/navegacion.ts`. Then integrate it into `web-shell` using the pattern in `productos-front` above (add as a `workspace:*` dependency of `web-shell`, list it in `next.config.mjs`'s `transpilePackages`, import its top-level component directly in the route's `page.tsx`). Don't invent ad-hoc shared UI — extend `commons` instead.
- Shared UI components (`PageHeader`, `SearchableTable`, `SkeletonTabla`, `EstadoChip`, `EstadoCotizacionChip`, `StatCard`, `Permiso`), feedback (`useToast`, `confirmar` — from `/feedback`), mock catalog data (`PRODUCTOS_MOCK`, `CLIENTES_MOCK`, `COTIZACIONES_MOCK`), and helpers (`formatearMoneda`, `formatearFecha`, `formatearFechaConHora`, `totalCotizacion`) all live in and are re-exported from `commons`. `Producto` carries `lote`, `fechaCaducidad?`, `precioCompra`, `precioVenta` (there is no single `precio` field).

## Mandatory architecture (non-negotiable, from the brief)

| Layer | Requirement |
|-------|-------------|
| Overall | SOFEA |
| Frontend | Microfrontends as separate apps/components — Next.js + TypeScript + MUI — **in place** |
| Backend | Microservices — NestJS (Prisma or TypeORM) — *not started* |
| Database | PostgreSQL (one schema/set of tables per service, by responsibility) — *not started* |
| Auth | JWT, roles **and** dynamic privileges; JWKS for service-to-service — *frontend mock only* |
| API docs | OpenAPI / Swagger (Scalar / ApiDog acceptable) — *not started* |
| Repo | pnpm monorepo + Turborepo — **in place** |

SOLID is a required, justified deliverable. Inter-service comms are primarily REST; events (Kafka) and Redis cache are "advanced" optional tiers. Data flow: `Clients (Web/Mobile) → App Shell / Microfrontends → API Gateway → Microservices → Postgres + Redis → Kafka`.

## Planned monorepo layout (frontend exists; rest is target)

```
apps/
  frontend/         # EXISTS — web-shell (host), commons (Design System), example-front (template), *-front
  backend/          # planned
    gateway/        # NestJS API Gateway — routing, auth, rate limiting
    services/       # auth, tenant, comercial/cotizaciones-ventas, inventario-productos, caja, compras, reportes, comprobantes
    commons/        # backend-only shared: contracts (versioned DTOs/events), observability, security (JWKS, guards, crypto), utils
    test/           # backend integration tests
  mobile/           # Flutter app-shell + plugins (only if mobile is in scope)
  addons/           # local dev tooling (e.g. project-dev-stack CLI for `pnpm dev:stack`)
  e2e/              # cross-app end-to-end tests
packages/           # cross-domain shared (shared-schemas, shared-protos, shared-devtools) — explicit only
docs/               # 00-overview, 01-architecture (c4/, decisions/ ADRs, standards/), 02-api, 03-runbooks, 04-product
infra/              # docker/{compose,images,scripts}, k8s, ci/jenkins, observability
agents/             # AI+human governance: developmentflow.md, rules/, checklists/, prompts/, templates/
scripts/            # repo automation (bootstrap, dev, lint, test, release, security-suite)
stubs/              # scaffolding templates (e.g. next-ts/)
```

`commons` is split deliberately: `apps/frontend/commons` and `apps/backend/commons` never cross. Use `packages/` only for genuinely cross-domain sharing, and make the dependency explicit. When building backend, write the OpenAPI contract (`docs/02-api/openapi/`) before implementing an endpoint; versioned DTOs/events live in `apps/backend/commons/contracts`.

### Local infrastructure (from SetUp General — for the backend phase)

```bash
docker run --name scipos-db -e POSTGRES_USER=root -e POSTGRES_PASSWORD=root \
  -e POSTGRES_DB=scipos -p 5432:5432 -d postgres:16
docker run --name scipos-redis -p 6379:6379 -d redis:5 redis-server --requirepass root
```

## Priority scope (Shape Up circuit breaker)

If time is short, the protected core to ship first is: **auth + dynamic privileges → productos → clientes → cotizaciones → conversión cotización-a-venta**. POS/caja, comprobante PDF, reportes, and compras come after. Don't let the privilege system degrade — it's the graded centerpiece.
