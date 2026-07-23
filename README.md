# SCIPOS · Sistema Comercial Integral

Plataforma comercial integral (productos, clientes, cotizaciones, ventas POS, caja,
compras y reportes) con **privilegios dinámicos por módulo y acción validados en el
backend**. Proyecto integrador del equipo **LOBOSOFT** (UTEZ, Desarrollo Web Integral).

**Stack:** monorepo pnpm + Turborepo · Frontend: Next.js + TypeScript + MUI
(microfrontends) · Backend: NestJS + Prisma (microservicios) · PostgreSQL + Redis ·
OpenAPI/Scalar.

| Documento | Para qué |
|---|---|
| [Guía del sistema](docs/readmes/GUIA-DEL-SISTEMA.md) | Qué hace cada módulo (funcional) |
| [Plan del Avance 3](docs/readmes/avance-3-plan-backend.md) | Reparto de trabajo del backend |
| [Contratos de API](docs/02-api/README.md) | Flujo contrato-primero y OpenAPI por servicio |
| [Plantilla de microservicio](apps/backend/services/example-service/README.md) | Cómo crear tu servicio |

---

# Encendido del sistema en local (dev)

Guía para levantar SCIPOS completo desde cero: infraestructura (Postgres + Redis),
backend (gateway + servicio de seguridad) y frontend (web-shell y microfrontends).

## 0. Requisitos (una sola vez por máquina)

| Herramienta | Versión | Verifica con |
|---|---|---|
| Node | ≥ 20 | `node --version` |
| pnpm | 11 | `pnpm --version` |
| Docker Desktop | reciente | `docker version` |
| Git | reciente | `git --version` |

> **Docker Desktop debe estar abierto** antes de empezar (icono de la ballena activo).
> Si `pnpm` no existe: `corepack enable` y vuelve a abrir la terminal.

## 1. Clonar e instalar

```bash
git clone https://github.com/LeobardoVillalobos88/Sistema-Comercial-Integral-SCIPOS.git
cd Sistema-Comercial-Integral-SCIPOS
git checkout develop
pnpm install
```

## 2. Variables de entorno

Cada app del backend trae un `.env.example`; cópialo como `.env` (los `.env` no se
suben a git):

```bash
cp apps/backend/gateway/.env.example apps/backend/gateway/.env
cp apps/backend/services/seguridad/.env.example apps/backend/services/seguridad/.env
cp apps/backend/services/productos/.env.example apps/backend/services/productos/.env
cp apps/backend/services/clientes/.env.example apps/backend/services/clientes/.env
cp apps/backend/services/cotizaciones/.env.example apps/backend/services/cotizaciones/.env
cp apps/backend/services/ventas-caja/.env.example apps/backend/services/ventas-caja/.env
cp apps/backend/services/reportes/.env.example apps/backend/services/reportes/.env
```

Los valores por defecto ya apuntan a la infraestructura local (Postgres y Redis del
paso 3), no hay que editar nada. El frontend no necesita `.env`: usa
`http://localhost:4000/api` por defecto.

## 3. Infraestructura + base de datos (un solo comando)

```bash
pnpm setup:backend
```

Ese comando hace, en orden: levanta los contenedores `scipos-db` (Postgres 16) y
`scipos-redis` (Redis 5), compila `@scipos/backend-commons` y prepara cada servicio
(genera el cliente de Prisma, aplica migraciones y siembra datos): la matriz de
privilegios con los 4 usuarios semilla, el catálogo de productos, los clientes, unas
cotizaciones de ejemplo y un turno de caja con ventas históricas — todo con los
mismos IDs que usaba el frontend simulado.

Si todo salió bien, la última línea dice algo como `Semilla aplicada: { cajas: 2, ventas: 2, movimientos: 4 }`

## 4. Levantar las apps

Lo mínimo para trabajar (todo el backend + el shell):

```bash
pnpm dev --filter @scipos/seguridad-service --filter @scipos/gateway --filter @scipos/productos-service --filter @scipos/clientes-service --filter @scipos/cotizaciones-service --filter @scipos/ventas-caja-service --filter @scipos/reportes-service --filter @scipos/web-shell
```

O todo el monorepo (todos los microfrontends y servicios existentes):

```bash
pnpm dev
```

### Puertos

| App | URL |
|---|---|
| web-shell (frontend) | http://localhost:3001 |
| API Gateway | http://localhost:4000 |
| Servicio de seguridad | http://localhost:4001 |
| Servicio de productos y compras | http://localhost:4002 |
| Servicio de clientes | http://localhost:4003 |
| Servicio de cotizaciones | http://localhost:4004 |
| Servicio de ventas POS y caja | http://localhost:4005 |
| Servicio de reportes y utilidad | http://localhost:4006 |

## 5. Verificar que todo funciona

1. **Salud del backend:** http://localhost:4000/health debe responder `"status": "ok"`
   con la tabla de servicios enrutados. http://localhost:4001/health responde el
   estado del servicio de seguridad.
2. **Documentación de la API:** http://localhost:4001/docs (Scalar).
3. **Frontend:** http://localhost:3001/inicio y cambia el rol en el topbar; en
   DevTools → Network verás las llamadas a `localhost:4000/api/seguridad/...`
   (los privilegios ya vienen del backend). Todos los módulos de dominio
   (`/productos`, `/clientes`, `/cotizaciones`, `/pos`, `/compras`, `/caja`,
   `/reportes` y `/usuarios`) y las tarjetas del dashboard operan contra la API
   real — ya no quedan mocks salvo en el módulo de ejemplo.
4. **La autenticación y el guard en acción** (desde otra terminal):

```bash
# Iniciar sesión: devuelve el token JWT, el usuario y sus privilegios
curl -X POST http://localhost:4000/api/seguridad/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"vendedor@scipos.com","contrasena":"Vendedor1234"}'

# 200 con el token (sustituye <TOKEN> por el del paso anterior)
curl -H "Authorization: Bearer <TOKEN>" http://localhost:4000/api/productos/productos

# 401: sin token (el gateway descarta cualquier x-usuario-id externo)
curl -i http://localhost:4000/api/seguridad/roles

# 403: el vendedor no puede eliminar productos aunque fuerce la petición
curl -i -X DELETE -H "Authorization: Bearer <TOKEN>" \
  http://localhost:4000/api/productos/productos/p-001
```

### Credenciales semilla (una cuenta por rol)

| Correo | Contraseña | Rol |
|---|---|---|
| `admin@scipos.com` | `Admin1234` | ADMINISTRADOR (acceso total) |
| `vendedor@scipos.com` | `Vendedor1234` | VENDEDOR |
| `cajero@scipos.com` | `Cajero1234` | CAJERO |
| `supervisor@scipos.com` | `Supervisor1234` | SUPERVISOR |

El selector de rol del topbar inicia sesión con estas cuentas tras bambalinas,
así todo el tráfico viaja con token desde el primer clic. La pantalla de login
puede construirse encima llamando a `iniciarSesion()` del contexto de permisos.

## 6. Apagar

```bash
# Ctrl+C en la terminal de pnpm dev, y después:
pnpm infra:down
```

## Problemas comunes

| Síntoma | Causa y solución |
|---|---|
| `docker: error during connect ...` | Docker Desktop no está abierto. Ábrelo y reintenta. |
| `EADDRINUSE :4000/:4001/:3001` | Ya hay algo corriendo en ese puerto (otra terminal con `pnpm dev`). Ciérrala. |
| El frontend muestra acciones pero la API responde 403 | Es el diseño: el frontend cayó a la matriz local porque el backend estaba apagado; levanta seguridad + gateway. |
| `P1001: Can't reach database server` | El contenedor `scipos-db` no está arriba: `pnpm infra:up`. |
| Quiero resetear la base de datos | `docker compose -f infra/docker/compose/docker-compose.dev.yml down -v` y de nuevo `pnpm setup:backend` (el `-v` borra los datos). |
| Redis apagado | El sistema sigue funcionando (solo pierde la caché); revisa `pnpm infra:up` si quieres la caché de privilegios. |
