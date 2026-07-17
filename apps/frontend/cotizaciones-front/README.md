# cotizaciones-front

Microfrontend de **Cotizaciones + conversión a venta** (RF-13 a RF-17).

## Qué hace

- **Listado de cotizaciones**: búsqueda, filtro por cliente (historial por cliente, RF-16) y
  por estado (Borrador/Enviada/Vendida), cargado desde la API.
- **Nueva cotización**: consulta clientes y productos reales, envía únicamente IDs y cantidades,
  y deja que el backend asigne el folio, consulte precios y calcule subtotal, IVA y total.
- **Detalle de cotización**: muestra los snapshots e importes confirmados por el backend, permite
  **marcar como enviada** y **convertir a venta** sin recapturar datos (RF-17).
- **Eliminar** cotización en borrador (solo Administrador, con confirmación).

Todas las acciones sensibles (crear, enviar, convertir, eliminar) están controladas con
`usePermisos()` / `<Permiso requiere="...">` de `@scipos/frontend-commons`.

## Backend

Todas las llamadas usan `llamarApi` de `@scipos/frontend-commons`, pasan por el gateway y
envían el header `x-usuario-id` del usuario activo:

- `GET/POST /api/cotizaciones/cotizaciones`
- `PATCH /api/cotizaciones/cotizaciones/:id/enviar`
- `POST /api/cotizaciones/cotizaciones/:id/convertir`
- `DELETE /api/cotizaciones/cotizaciones/:id`

Para crear cotizaciones también deben estar disponibles seguridad, clientes y productos. La
conversión requiere el servicio de ventas-caja.

## Correr el módulo

```bash
pnpm install
pnpm --filter @scipos/cotizaciones-front dev   # http://localhost:3005
```

La URL base del gateway se puede cambiar con `NEXT_PUBLIC_API_URL`; por defecto es
`http://localhost:4000/api`.
