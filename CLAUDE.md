# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

**SCIPOS — Sistema Comercial Integral**: a commercial/POS platform (productos, clientes, cotizaciones, ventas POS, caja, compras, comprobante PDF simulado, reportes). University integrator project (UTEZ, team "LOBOSOFT", course *Desarrollo Web Integral*). Methodology: **Shape Up** (pitch / appetite / scopes / circuit breaker — see `Avance 1` PDF §12).

The defining requirement (graded above everything else): **dynamic per-module, per-action privileges**, not just roles. A user sees, hides, enables, or is blocked from each function based on privileges assigned dynamically. Roles: Administrador, Vendedor, Cajero, Supervisor. **Frontend hiding is never sufficient — the backend must validate every protected action** (RF-05/RF-06, RNF-15). Both halves exist now: the backend `seguridad` service is the source of truth and every protected endpoint is guarded; the frontend reflects what the API says.

The spec PDFs in `docs/pdfs/` (`Integradora 9C.docx.pdf`, `Avance 1 Integradora Ulises.pdf`, `SetUp General.pdf`) are the source of truth for requirements. `docs/readmes/avance-2-plan-frontend.md` produced the frontend; `docs/readmes/avance-3-plan-backend.md` is the active plan for the backend (task split per team member); `docs/readmes/GUIA-DEL-SISTEMA.md` is the team-facing functional guide; the root `README.md` is the local-dev startup runbook.

## Current state

The **entire brief is implemented**: gateway plus six domain services — `seguridad` (4001, now with JWT auth), `productos` (4002, includes compras/inventario), `clientes` (4003, includes historial distribuido), `cotizaciones` (4004, includes conversión a venta), `ventas-caja` (4005, POS + caja + comprobante PDF) and `reportes` (4006, no DB — aggregates over REST) — plus seven microfrontends (`productos-front` 3003, `clientes-front` 3004, `cotizaciones-front` 3005, `pos-caja-front` 3006, `reportes-front` 3007, and `login-front` — the sign-in screen, a pure component with no dev port) and the `/usuarios` admin page inside web-shell. Everything consumes the real API with JWT; no domain module runs on mocks. Seeds are intentionally small: 4 users (one per role), 7 products, 5 clients, 3 quotes, 2 historic cash-register shifts. Mobile (Flutter) is not in scope; the web is responsive via MUI breakpoints (no Bootstrap — it would clash with the mandated stack). `pnpm-workspace.yaml` includes `apps/frontend/*`, `apps/backend/*`, `apps/backend/services/*`, and `packages/*`.

### What exists today (`apps/frontend/`)

- **`web-shell/`** (`@scipos/web-shell`, port 3001) — the host app (Next.js App Router). `AppShell` = Topbar + Sidebar + content area; `src/config/navegacion.ts` is the single source for the sidebar menu (each module's route, icon, and required privilege). Routes: `/inicio` (landing with business-overview stat cards and `@mui/x-charts` bar charts comparing precioCompra vs precioVenta), `/dashboard` (role-reactive stat cards), `/productos`, `/clientes`, `/cotizaciones`, `/pos`, `/compras` (the POS in `modo="compra"`, guarded by `compras:ver` — Admin/Supervisor only), `/caja`, and `/login` (the sign-in screen, rendered outside the shell — `AppShell` redirects here when there's no session).
- **`commons/`** (`@scipos/frontend-commons`) — the Design System and shared library. **All shared frontend code is imported from here**, via subpath exports: `@scipos/frontend-commons` (barrel), `/theme`, `/permisos`, `/components`, `/feedback`, `/mocks`. It is a source-only package (`main`/`types` point at `src/index.ts`) consumed through Next's `transpilePackages` — there is no build step for it. `/feedback` provides `ToastProvider`/`useToast` (top-right snackbars: exito=green/check, error=red/x, info=blue/!) and `confirmar()`/`alertaExito()`/`alertaError()` (SweetAlert2). The barrel also exports `SkeletonTabla`, the standard loading placeholder to render while a view waits for its data.- **`productos-front/`** (`@scipos/productos-front`, port 3003) — RF-07/08/09: `CatalogoProductos` with search, estado/tipo filters, create/edit dialog (lote, caducidad, **precioCompra + precioVenta**, real-time input validation), soft-delete toggle, and hard delete (Admin-only `productos:eliminar`, confirm + toast). Fully backed by the productos API via `llamarApi` (waits for permisos before fetching; `SkeletonTabla` while loading).
- **`clientes-front/`** (`@scipos/clientes-front`, port 3004) — RF-10/11/12: CRUD + activate/deactivate + hard delete (`clientes:eliminar`), and a detail dialog with the client's cotizaciones/ventas history in tabs, guarded by `clientes:*`. Phone input enforces 10 digits in real time (backend re-validates). Fully backed by the clientes API, including the historial tab (shows partial data when a source service is down).
- **`cotizaciones-front/`** (`@scipos/cotizaciones-front`, port 3005) — RF-13→17: create quote, list/filter, delete (`cotizaciones:eliminar`), and the **BORRADOR → ENVIADA → VENDIDA** lifecycle (buttons "Marcar como enviada" and "Convertir a venta"), guarded by `cotizaciones:*` (incl. `cotizaciones:enviar`, `cotizaciones:convertir`). Folio, subtotal, IVA and total are all computed by the backend — the frontend never invents a price. State lives in `CotizacionesContext` wrapping `llamarApi`; local types in `src/tipos.ts` (`CotizacionApi`, matching the service's response shape) replace the old commons mock type.
- **`pos-caja-front/`** (`@scipos/pos-caja-front`, port 3006) — RF-18→26: POS (cart, IVA, descuento, cancelar) **and** caja (apertura, movimientos, corte). A single `PosCajaPage` serves `/pos`, `/compras` and `/caja` via `defaultTab`/`hideTabs`/`modo` props: `modo="venta"` (default) sells at precioVenta and decrements stock (requires an open caja); `modo="compra"` buys at precioCompra, increments stock, and does not require the caja. Sensitive actions guarded by `pos:*` / `caja:*`. Fully backed by the ventas-caja API via `src/api/posApi.ts`: sale payloads only carry `productoId`/`cantidad` (the backend prices from the product catalog, never trusts a client-sent price), and `CajaContext` hydrates the open shift from `GET /ventas-caja/caja/estado` on mount so a page reload doesn't lose an open turno. The module is split so the money math is testable outside React: `src/calculos/calculos-pos.ts` holds the pure arithmetic (`calcularTotales`, `precioSegunModo`, and the cart transforms) with its spec beside it, `src/hooks/useCarrito.ts` owns cart state and derives the totals from it, and `src/components/` carries `PanelCaja` (the whole caja tab) plus the `PanelSeccion`/`ResumenMonto` primitives both tabs share. `PosCajaPage` keeps the API calls, the privilege checks, the toasts and the venta tab; `PanelCaja` holds no state of its own and receives everything as props.

- **`reportes-front/`** (`@scipos/reportes-front`, port 3007) — RF-30/31/33: `PanelReportes` with five tabs (ventas, cotizaciones, inventario valuado, cortes, utilidad), date-range filter and CSV export per tab. All data comes from the reportes service (`reportes:ver` enforced server-side).
- **`/usuarios`** (page inside web-shell, not a separate package) — user administration for RF-02/RF-03: create/edit users with role + password, activate/deactivate, delete (can't delete yourself), guarded by `seguridad:*` privileges. Sidebar entry appears only with `seguridad:ver` (admin).

**Integration pattern**: `web-shell` embeds each domain microfrontend by depending on it as a normal `workspace:*` package (not an iframe or module-federation remote): add the package to both `next.config.mjs`'s `transpilePackages` and `web-shell/package.json` dependencies, then import its top-level component in the route's `page.tsx` (e.g. `import { CatalogoProductos } from "@scipos/productos-front"`). Follow this same wiring for every new `*-front` module. Each `*-front` gets its own dev port (3003-3007 … next free is 3008).

**Table-action convention**: action buttons render in fixed order **Ver (eye, `primary`) → Activar/Desactivar (toggle, `success`) → Editar (pencil, `info`) → Eliminar (trash, `error`)**, omitting the ones a module doesn't have. Delete is Admin-only (`modulo:eliminar`), always behind `confirmar()` and followed by a toast.

### What exists today (`apps/backend/`)

- **`gateway/`** (`@scipos/gateway`, port 4000) — the single HTTP entry point. Proxies `/api/<servicio>/*` to each service port (routing table + CORS origins for 3001-3007 in `src/config/servicios.ts`), **strips any external `x-usuario-id` header** (that header is the internal inter-service identity channel; outside identity must be a Bearer JWT), answers 502 JSON when a service is down. The frontend only ever talks to the gateway (`NEXT_PUBLIC_API_URL`, default `http://localhost:4000/api`).
- **`commons/`** (`@scipos/backend-commons`) — backend-only shared lib, **compiled with tsc to `dist/`** (unlike frontend commons); services consume it as `workspace:*` and turbo builds it first (`dev`/`build` depend on `^build`). Exports: `@RequierePrivilegio("modulo:accion")` / `@RequiereIdentidad()` decorators, `GuardPrivilegios` (async: resolves identity, checks the denylist, then privileges), `ModuloSeguridad.registrar()` (registers the guard globally; accepts custom `ProveedorPrivilegios`/`ExtractorIdentidad`/`VerificadorDenylist`), `ExtractorIdentidadJwt` (verifies RS256 Bearer tokens via `VerificadorToken` against the JWKS; falls back to `x-usuario-id` for inter-service calls), `VerificadorToken` (`createRemoteJWKSet` + iss/aud), `DenylistRedis` + `PREFIJO_DENYLIST` (revoked-token lookup), `ClienteHttp` (inter-service REST with timeout + error mapping), `FiltroExcepcionesHttp` (standard error shape `{ estatus, mensaje, error, ruta, fecha }`), and shared contracts (`UsuarioSesion`, `ResultadoVerificacion`, token `iss`/`aud`/JWKS helpers). Depends on `jose` (JWKS/verify) and `ioredis` (denylist).
- **`services/seguridad/`** (`@scipos/seguridad-service`, port 4001, Postgres schema `seguridad`) — the source of truth for identity and privileges. Auth: `POST /auth/login` (bcrypt), `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/perfil`, `GET /.well-known/jwks.json`; signs RS256 tokens with the private key (`FirmadorToken`). User CRUD (create with password, update incl. password reset, delete guarded against self-deletion) behind `seguridad:ver/crear/editar/eliminar`. Tables: `Rol` (with `accesoTotal` for ADMINISTRADOR), `Privilegio` catalog, `RolPrivilegio`, `Usuario`, `UsuarioPrivilegio` (`concedido: true` grants / `false` revokes per user, RF-03), `RefreshToken` (hashed, rotating, `familyId`). Effective privileges = role's + granted − revoked, cached in Redis 60s and invalidated on every assignment change. Key endpoints: `GET /usuarios` (behind `seguridad:ver`), `GET /usuarios/:id/privilegios`, `GET /privilegios/verificar?usuarioId&privilegio` (what other services' guards call), grant/revoke per role and per user. Seed loads the privilege catalog, the role matrix (mirror of frontend `matriz.ts`) and 4 fixed users with bcrypt-hashed passwords (`admin@scipos.com`/`Admin1234`, `vendedor@…`/`Vendedor1234`, `cajero@…`/`Cajero1234`, `supervisor@…`/`Supervisor1234`).
- **`services/productos/`** (`@scipos/productos-service`, port 4002, schema `productos`) — catálogo CRUD + baja lógica + hard delete (409 if referenced by compras), `POST /compras` (transactional, increments stock, RF-36), `POST /productos/:id/stock` (internal endpoint for ventas-caja: delta +/- with negative-stock guard), `GET /productos/resumen` for the dashboard. Routes mounted under `/productos` prefix → gateway URLs look like `/api/productos/productos`.
- **`services/clientes/`** (`@scipos/clientes-service`, port 4003, schema `clientes`) — CRUD with search, 10-digit phone + RFC validation, `GET /:id/historial` (aggregates cotizaciones+ventas over REST propagating identity; returns `parcial`/`fuentesFallidas` when a source is down, RF-12), `GET /resumen`. Routes mounted at the service root → gateway URLs look like `/api/clientes` (note the style difference vs productos; literal routes must be declared before `":id"` in the controller).
- **`services/cotizaciones/`** (`@scipos/cotizaciones-service`, port 4004, schema `cotizaciones`) — quotes with a transactional sequential folio (`SecuenciaFolio` upsert, `COT-000001` style), **BORRADOR → ENVIADA → VENDIDA** lifecycle, and totals computed server-side with `decimal.js` (`calculos-cotizacion.ts`, unit-tested with `pnpm --filter @scipos/cotizaciones-service test`, plain `node:test` via `tsx`, no extra test runner dependency). `POST /:id/convertir` calls ventas-caja's `POST /ventas/convertir-cotizacion` inside a Postgres advisory lock (`pg_advisory_xact_lock`) and only flips the quote to VENDIDA if the sale was actually created; retrying an already-converted quote returns the same result instead of erroring. Validates client and every product exist (and are active) via `ClientesClient`/`ProductosClient` before creating anything. `GET /cotizaciones/resumen` for the dashboard.
- **`services/ventas-caja/`** (`@scipos/ventas-caja-service`, port 4005, schema `ventas_caja`) — POS sales and caja (cash-register shifts) in one service. `POST /ventas` and `POST /ventas/convertir-cotizacion` both funnel through the same `registrarVenta`: require an open caja, **re-price every partida from the productos service** (never trusts a client-sent price — this is the one place the team had to fix a real "trust the client" bug), apply `pos:descuento` only with that privilege, and call `productos`' `POST /:id/stock` to decrement (or, on `POST /:id/cancelar`, re-increment). `Venta.cotizacionId` is `@unique`, making conversions idempotent. `GET /caja/estado` reports the open shift (if any) plus its movements and running total — the frontend hydrates from it on load instead of trusting client-side state alone. `caja/cerrar` sums the shift's ventas + ingresos − egresos into `montoFinal`. `GET /ventas/resumen` for the dashboard. `GET /ventas/:id/comprobante` renders the **non-fiscal PDF receipt** with pdfkit (RF-27/28/29), resolving client/product names over REST.
- **`services/reportes/`** (`@scipos/reportes-service`, port 4006, **no database**) — reports for ventas, cotizaciones, inventario valuado, cortes and utilidad (RF-30/31/33). Aggregates everything over REST from the other services propagating the caller's identity, with a 30s Redis cache for utilidad. All endpoints behind `reportes:ver`.
- Every domain service follows the same shape (use `clientes` or `productos` as a reference) and defines a `preparar` script (generate + migrate deploy + seed) that `pnpm setup:backend` runs.
- Every service follows the same stack: NestJS 11 + Prisma 7 (`@prisma/adapter-pg`) + `class-validator` + Swagger/Scalar (`/docs`, `/api-json`) + Redis (ioredis, degrades gracefully if down) + `/health`. **Gotcha:** the pg adapter does NOT read `?schema=` from the URL — `prisma.service.ts` and seeds parse it and pass `{ schema }` to `PrismaPg` explicitly; keep that pattern.
- **Gotcha:** Prisma applies migrations in filename (timestamp) order, not creation order. If you hand-write a migration folder instead of running `prisma migrate dev` interactively, its timestamp prefix must sort **after** every migration it depends on, or `migrate deploy` fails trying to alter a table that doesn't exist yet.
- **JWT auth is live (RS256 + JWKS)**: seguridad signs access tokens with an **RSA private key** and publishes the public one at `GET /.well-known/jwks.json`; the gateway and every service verify against that JWKS — only seguridad can mint tokens (no shared secret). Keys are generated by `pnpm generar:llaves` (run by `setup:backend`) into `keys/`, **git-ignored**; env vars `JWT_ISSUER`/`JWT_AUDIENCE` (checked as `iss`/`aud`) and `AUTH_JWKS_URL` are the same across services. Tokens carry `sub`/`jti`/`iss`/`aud`; **access is short (15 min)**, paired with a **rotating refresh token** (`RefreshToken` table, hashed, `familyId`; reusing a consumed token revokes the whole family — theft defense). `POST /auth/login` → `{ token, refreshToken, usuario, privilegios }`; `POST /auth/refresh` rotates; `POST /auth/logout` adds the `jti` to a **Redis denylist** (`revocado:acceso:<jti>`) and revokes the user's refresh tokens, cutting the session across all services instantly. The gateway's `jwt-edge.middleware` verifies (signature + iss/aud + denylist) before proxying; services re-verify (defense in depth). `x-usuario-id` remains the internal inter-service channel; the gateway strips it from external requests. Controllers use `@UsuarioActual()` (guard-resolved id), never read headers. Frontend: `llamarApi` auto-refreshes on 401 and retries once; `PermisosProvider` stores both tokens in `sessionStorage` per-tab and exposes `iniciarSesion`/`cerrarSesion` from `usePermisos()`; the login screen (`/login`, `login-front`) calls `iniciarSesion(correo, contrasena)`; from then on every session is token-signed. The topbar shows the signed-in user; the sidebar's logout hits `POST /auth/logout`. `AppShell` redirects to `/login` when there's no session.

### The privilege system (backend validates, frontend reflects)

Backend half: every sensitive endpoint carries `@RequierePrivilegio("modulo:accion")`; the global guard answers **401** without `x-usuario-id` and **403** without the privilege, consulting the `seguridad` service (other services via HTTP, `seguridad` itself via a local provider). If a frontend button is behind `can("x:y")`, its endpoint must be behind `@RequierePrivilegio("x:y")` — no exceptions.

Frontend half, in `apps/frontend/commons/src/permisos/` + `src/api/`:
- `PermisosProvider.tsx` — downloads users from `GET /seguridad/usuarios` and the active user's effective privileges from `GET /seguridad/usuarios/:id/privilegios`. The login screen signs in a **seed user**; `can()` checks the downloaded list. If the API is unreachable it falls back to the local `matriz.ts` so the UI stays navigable (`origenPermisos: "api" | "local"` tells you which).
- `clienteApi.ts` — `llamarApi("/servicio/ruta")` calls the gateway and adds `x-usuario-id` for the active user automatically; throws `ErrorApi` with the backend's Spanish `mensaje`. **All frontend API calls must go through it.**

Gate UI two ways:
```tsx
const { can } = usePermisos();
{can("productos:crear") && <Button>Nuevo</Button>}                    // imperative
<Permiso requiere="productos:crear"><Button>Nuevo</Button></Permiso>  // declarative
```
New `modulo:accion` strings are registered in the **seguridad catalog** (its seed, or `POST /privilegios`) and mirrored in `matriz.ts` (the offline fallback). Do not let this system degrade — it is the graded centerpiece.

## Commands

Run from the repo root. Use **pnpm** (workspaces), not npm. **Node ≥ 22** (`.nvmrc` says 22; pnpm 11 uses `node:sqlite`, absent before 22.5, so Node 20 cannot even install); package manager pinned to pnpm 11 (`packageManager` field).

```bash
pnpm install                                  # install the whole monorepo
pnpm infra:up                                 # Postgres + Redis containers (Docker must be running)
pnpm generar:llaves                           # RSA keys for RS256 JWT signing (into keys/, git-ignored)
pnpm setup:backend                            # keys + infra + build commons + prisma migrate deploy + seed (first time / reset)
pnpm dev                                      # turbo run dev — all apps at once
pnpm dev --filter @scipos/seguridad-service --filter @scipos/gateway --filter @scipos/web-shell   # minimal working set
pnpm --filter @scipos/web-shell dev           # just the host        → http://localhost:3001
pnpm --filter @scipos/productos-front dev     # just productos       → http://localhost:3003
pnpm --filter @scipos/clientes-front dev      # just clientes        → http://localhost:3004
pnpm --filter @scipos/cotizaciones-front dev  # just cotizaciones    → http://localhost:3005
pnpm --filter @scipos/pos-caja-front dev      # just POS + caja      → http://localhost:3006
pnpm --filter @scipos/seguridad-service dev   # seguridad service    → http://localhost:4001 (needs commons built)
pnpm --filter @scipos/productos-service dev   # productos + compras  → http://localhost:4002
pnpm --filter @scipos/clientes-service dev    # clientes             → http://localhost:4003
pnpm --filter @scipos/cotizaciones-service dev # cotizaciones        → http://localhost:4004
pnpm --filter @scipos/ventas-caja-service dev  # POS + caja          → http://localhost:4005
pnpm --filter @scipos/reportes-service dev     # reportes             → http://localhost:4006 (sin BD)
pnpm --filter @scipos/reportes-front dev       # reportes UI          → http://localhost:3007
pnpm --filter @scipos/gateway dev             # API gateway          → http://localhost:4000
pnpm test                                     # turbo run test — every package that defines one
pnpm --filter @scipos/seguridad-service test  # effective privileges (node:test via tsx)
pnpm --filter @scipos/cotizaciones-service test # totals + conversion to sale
pnpm --filter @scipos/pos-caja-front test     # POS money math and cart transforms
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
- **Three packages have tests**, all on `node:test` run through `tsx` with no test-runner dependency: `cotizaciones-service` (`calculos-cotizacion.spec.ts`, `cotizaciones.service.spec.ts`), `seguridad-service` (`privilegios.service.spec.ts`) and `pos-caja-front` (`calculos-pos.spec.ts`). The seguridad suite pins the graded rule: effective privileges are the role's plus the granted minus the revoked, and an individual revocation beats even a role with `accesoTotal`. None of them need a database, Redis or a rendered component — they inject plain objects cast as `PrismaService`/`RedisService`, or call pure functions. `pnpm test` (turbo `test` task) runs whatever `test` script each package defines; packages without one are a no-op. Follow this same pattern (`tsx --test src/<modulo>/*.spec.ts`, no new devDependency) when adding tests elsewhere, and put the logic worth testing in a pure module so the test never has to mount React.
- Turborepo orchestrates cross-package tasks (`turbo.json`); `dev`/`start` are persistent and uncached (`dev` depends on `^build` so `backend-commons` compiles first), `build` outputs `.next/**` and `dist/**`. Top-level `concurrency` is `"20"` because every dev task is persistent — raise it if the count of dev tasks approaches it.
- pnpm 11 gates dependency postinstall scripts via `allowBuilds` in `pnpm-workspace.yaml` (prisma/esbuild approved). If a new dep needs its build script, add it there instead of re-running blindly.

## Conventions

- **Commits** must follow Conventional Commits **without a scope** — `tipo: mensaje corto` (e.g. `feat: catalogo de productos con filtros`), never `tipo(scope): ...`. Enforced by the `commit-msg` husky hook (`commitlint.config.cjs`); Spanish subjects are expected (`subject-case` is disabled). Allowed types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert. The `pre-commit` hook runs `pnpm lint`. Never add Claude as co-author.
- **Language**: requirements, docs, UI copy, code comments, and identifiers are **Spanish (es-MX)** — match the surrounding code (`usePermisos`, `temaScipos`, `MATRIZ_PRIVILEGIOS`, `etiqueta`).
- **No forward-references or personal attributions in code**: comments and UI copy must never mention future phases ("avance", "se hará en backend", "prototipo") or team members' names. Describe what the code does today.
- **Branching**: `main` tracks releases, `develop` is the integration branch. Work happens on `feature/<algo>` / `fix/<algo>` / `style/<algo>` branches (e.g. `feature/clientes-gestion`, `feature/productos-catalogo`) merged into `develop` via PR.
- **New domain microfrontend**: model it on an existing `*-front` (e.g. `productos-front`) — a source-only `@scipos/<dominio>-front` package that depends on `@scipos/frontend-commons` (`workspace:*`) — and wire its route into `web-shell/src/config/navegacion.ts`. Then integrate it into `web-shell` using the pattern in `productos-front` above (add as a `workspace:*` dependency of `web-shell`, list it in `next.config.mjs`'s `transpilePackages`, import its top-level component directly in the route's `page.tsx`). Don't invent ad-hoc shared UI — extend `commons` instead.
- **New microservice**: model it on an existing service (e.g. `clientes` or `productos`) — name it `@scipos/<dominio>-service`, give it its own port and own Postgres schema, and register the route in `gateway/src/config/servicios.ts`. **Contract first**: write `docs/02-api/openapi/services/<dominio>.yaml` before implementing (follow `seguridad.yaml`). Every sensitive endpoint gets `@RequierePrivilegio`; services never read another service's schema — cross-domain data goes over REST via `ClienteHttp`.
- Shared UI components (`PageHeader`, `SearchableTable`, `SkeletonTabla`, `EstadoChip`, `EstadoCotizacionChip`, `StatCard`, `Permiso`), feedback (`useToast`, `confirmar` — from `/feedback`), and helpers (`formatearMoneda`, `formatearFecha`, `formatearFechaConHora`) all live in and are re-exported from `commons`. `SearchableTable` requires a `claveFila` prop (the row's stable id): the list reorders while filtering, so a positional key would carry a row's state onto a different record. The theme also exports `MARCA_OSCURA` — the dark brand surfaces used by the sidebar and the sign-in screen, which sit outside MUI's light-mode palette; use those tokens instead of retyping the gradient or its slate tones. `Producto` carries `lote`, `fechaCaducidad?`, `precioCompra`, `precioVenta` (there is no single `precio` field). `PRODUCTOS_MOCK`/`CLIENTES_MOCK` remain in `commons/mocks` only as an offline fallback for `/inicio` and the dashboard stat cards when their service is down — every real domain module (`productos-front`, `clientes-front`, `cotizaciones-front`, `pos-caja-front`) is fully API-backed. `COTIZACIONES_MOCK` and the `totalCotizacion()` helper were removed once cotizaciones-front connected to the real API (the backend computes totals now); don't recreate them.

## Mandatory architecture (non-negotiable, from the brief)

| Layer | Requirement |
|-------|-------------|
| Overall | SOFEA |
| Frontend | Microfrontends as separate apps/components — Next.js + TypeScript + MUI — **in place** |
| Backend | Microservices — NestJS + Prisma — **in place**: gateway + 6 domain services (seguridad, productos, clientes, cotizaciones, ventas-caja, reportes) + commons + template |
| Database | PostgreSQL (one schema per service, single `scipos` DB in Docker) — **in place** |
| Auth | JWT (RS256 + JWKS), roles **and** dynamic privileges — **in place** (login + bcrypt, refresh-token rotation, logout denylist, edge + per-service verification) |
| API docs | OpenAPI / Swagger with Scalar — **in place** (`/docs` per service; contracts in `docs/02-api/openapi/`) |
| Repo | pnpm monorepo + Turborepo — **in place** |

SOLID is a required, justified deliverable. Inter-service comms are primarily REST; events (Kafka) and Redis cache are "advanced" optional tiers. Data flow: `Clients (Web/Mobile) → App Shell / Microfrontends → API Gateway → Microservices → Postgres + Redis → Kafka`.

## Monorepo layout (what exists vs. target)

```
apps/
  frontend/         # EXISTS — web-shell (host), commons (Design System), *-front
  backend/          # BASE EXISTS
    gateway/        # EXISTS — NestJS API Gateway (port 4000): routing per service, CORS
    services/       # EXISTS: seguridad (4001), productos (4002), clientes (4003), cotizaciones (4004), ventas-caja (4005), reportes (4006, sin BD)
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

### Deployment infrastructure

The repo ships a container deployment for a single host (EC2), documented end to end in `docs/DESPLIEGUE-AWS.md`. Scripts: `pnpm prod:build` / `prod:up` / `prod:down` / `prod:logs`.

- **Two Dockerfiles, not nine.** `infra/docker/Dockerfile.backend` produces **one image shared by all seven backend processes** (gateway + 6 services): they share the monorepo, its dependencies and `backend-commons`, so seven near-identical images would multiply build time and disk for nothing. Each service is still its own container and process with its own port and Postgres schema — `working_dir` per service in compose selects which one boots. `infra/docker/Dockerfile.web` builds web-shell. Each Prisma schema declares `output = "../node_modules/.prisma/client"`, so the six clients coexist in one image without clobbering each other.
- **nginx is the only published port** (`infra/nginx/nginx.conf`): `/` → web-shell, `/api/` → gateway. Same origin, so CORS is effectively moot; services 4001-4006, Postgres and Redis stay on the internal Docker network. `origenesPermitidos()` now reads `ORIGENES_PERMITIDOS` (comma-separated) and keeps the localhost list as the dev fallback.
- **`NEXT_PUBLIC_API_URL` defaults to `/api`, a relative path.** Next resolves `NEXT_PUBLIC_*` at build time, so an absolute URL would force an image rebuild per domain or IP. It enters `Dockerfile.web` as a build arg — keep it relative.
- **Keys by env var.** `FirmadorToken` accepts `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY` (raw PEM, escaped `\n`, or base64) with priority over `*_PATH`; `pnpm llaves:entorno` prints the base64 pair ready to paste. `pnpm generar:llaves` and the `keys/` flow are unchanged for local dev.
- **Migrations run on boot** via `infra/docker/entrypoint-backend.sh` when `EJECUTAR_MIGRACIONES=true` (idempotent). Seeding is opt-in with `EJECUTAR_SEMILLA=true` so a restart doesn't reload data. Seed passwords are overridable with `SEED_*_PASSWORD`.
- The root `.env.example` is the single file a deployer fills; per-service `.env.example` files remain for local dev. `.dockerignore` keeps `node_modules`, `keys/` and every `.env` out of the build context.

## Priority scope (Shape Up circuit breaker)

**Every scope in the brief is done and verified end-to-end**, including the advanced auth tier: JWT **RS256 + JWKS**, refresh-token rotation and instant logout (denylist); dynamic privileges, productos, clientes, cotizaciones + conversión a venta (idempotent, stock-decrementing), POS/caja, compras, comprobante PDF and reportes/utilidad (the dashboard's "Utilidad de hoy" card reads the real `/reportes/utilidad` for today). Remaining ideas are optional advanced tiers only (Kafka events, CI/CD, multi-tenant). Don't let the privilege system degrade — it's the graded centerpiece.
