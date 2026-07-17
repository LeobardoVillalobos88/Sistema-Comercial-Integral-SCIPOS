# Servicio de cotizaciones

Microservicio NestJS del dominio de cotizaciones de SCIPOS. Es dueño exclusivo del schema
PostgreSQL `cotizaciones`; los clientes, productos y ventas se consultan por REST.

## Funciones

- Folios consecutivos `COT-000001`, asignados atómicamente en PostgreSQL.
- Precios obtenidos de productos y totales calculados con precisión decimal en el servidor.
- Ciclo de vida `BORRADOR → ENVIADA → VENDIDA`.
- Conversión segura a venta; `VENDIDA` solo se guarda si ventas-caja confirma un `id`.
- Listado con filtros, historial por cliente y resumen para dashboard.
- Guard compartido de `@scipos/backend-commons` con identidad `x-usuario-id`.
- OpenAPI vivo en `/api-json`, Scalar en `/docs` y health check en `/health`.

## Privilegios

| Operación | Privilegio |
| --- | --- |
| Listar, detalle, historial y resumen | `cotizaciones:ver` |
| Crear | `cotizaciones:crear` |
| Marcar como enviada | `cotizaciones:enviar` |
| Convertir a venta | `cotizaciones:convertir` |
| Eliminar un borrador | `cotizaciones:eliminar` |

El servicio de seguridad debe registrar estas cinco claves. La identidad viaja por header para poder
cambiar el extractor a JWT sin modificar controladores ni lógica de dominio.

## Desarrollo local

Desde la raíz del repositorio:

```bash
cp apps/backend/services/cotizaciones/.env.example apps/backend/services/cotizaciones/.env
pnpm install
pnpm --filter @scipos/cotizaciones-service prisma:generate
pnpm --filter @scipos/cotizaciones-service prisma:deploy
pnpm --filter @scipos/cotizaciones-service seed
pnpm --filter @scipos/cotizaciones-service dev
```

El contrato estático está en `docs/02-api/openapi/services/cotizaciones.yaml`. Para crear una
cotización deben estar disponibles seguridad (4001), productos (4002) y clientes (4003). Para
convertir también debe estar disponible ventas-caja (4005).

## Contratos REST esperados

- `GET {SEGURIDAD_URL}/privilegios/verificar?usuarioId=...&privilegio=...` → `{ tiene: boolean, motivo?: string }`.
- `GET {CLIENTES_URL}/:id` → `{ id, nombre, activo }`.
- `GET {PRODUCTOS_URL}/productos/:id` → `{ id, nombre, precioVenta, activo }`.
- `POST {VENTAS_CAJA_URL}/ventas/desde-cotizacion` → `{ id }`.
