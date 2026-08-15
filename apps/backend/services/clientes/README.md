# Servicio de clientes

Microservicio NestJS del dominio de clientes de SCIPOS. Es dueño exclusivo del schema
PostgreSQL `clientes` (puerto **4003**); las cotizaciones y ventas para el historial se
consultan por REST.

## Funciones

- CRUD de clientes con búsqueda, validación de teléfono (10 dígitos) y RFC.
- Baja/alta lógica (activar/desactivar) y borrado definitivo (solo Administrador).
- Historial por cliente (`GET /:id/historial`): agrega cotizaciones y ventas por REST
  propagando la identidad; devuelve `parcial`/`fuentesFallidas` si una fuente está
  caída, en lugar de fallar (RF-12).
- Resumen para el dashboard (`GET /resumen`).
- Guard compartido de `@scipos/backend-commons`: la identidad llega como **Bearer JWT
  (RS256)** verificado contra el JWKS; `x-usuario-id` queda solo como canal interno
  entre servicios.
- OpenAPI vivo en `/api-json`, Scalar en `/docs` y health check en `/health`.

## Rutas y privilegios

Montadas en la raíz del servicio → a través del gateway: `http://localhost:4000/api/clientes/...`

| Método | Ruta | Privilegio |
| --- | --- | --- |
| GET | `/` (listar + buscar) | `clientes:ver` |
| GET | `/:id` | `clientes:ver` |
| GET | `/:id/historial` | `clientes:ver` |
| POST | `/` | `clientes:crear` |
| PATCH | `/:id` | `clientes:editar` |
| PATCH | `/:id/estado` (activar/desactivar) | `clientes:editar` |
| DELETE | `/:id` | `clientes:eliminar` |
| GET | `/resumen` | — (dashboard) |

## Desarrollo local

Desde la raíz del repositorio:

```bash
cp apps/backend/services/clientes/.env.example apps/backend/services/clientes/.env
pnpm install
pnpm --filter @scipos/clientes-service prisma:migrate
pnpm --filter @scipos/clientes-service seed
pnpm --filter @scipos/clientes-service dev
```

El contrato estático está en `docs/02-api/openapi/services/clientes.yaml`. Para el
historial deben estar disponibles seguridad (4001), cotizaciones (4004) y ventas-caja
(4005); si alguno está caído, el historial responde parcial en vez de romperse.
