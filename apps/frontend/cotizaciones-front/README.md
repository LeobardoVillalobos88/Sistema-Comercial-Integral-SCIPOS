# cotizaciones-front

Microfrontend de **Cotizaciones + conversión a venta** (RF-13 a RF-17).

## Qué hace

- **Listado de cotizaciones**: búsqueda, filtro por cliente (historial por cliente, RF-16) y
  por estado (Borrador/Enviada/Vendida).
- **Nueva cotización**: selecciona cliente (`CLIENTES_MOCK`), agrega productos
  (`PRODUCTOS_MOCK`) con cantidad, calcula subtotal por partida y total, y genera el folio
  automático (`COT-AAAA-000N`).
- **Detalle de cotización**: muestra partidas y total, permite **marcar como enviada** y
  **convertir a venta** sin recapturar datos (RF-17) — la cotización queda como `VENDIDA`.
- **Eliminar** cotización (solo Administrador, con confirmación).

Todas las acciones sensibles (crear, enviar, convertir, eliminar) están controladas con
`usePermisos()` / `<Permiso requiere="...">` de `@scipos/frontend-commons`.

## Datos

- `COTIZACIONES_MOCK` vive en `@scipos/frontend-commons`
  (`apps/frontend/commons/src/mocks/cotizaciones.ts`) porque otros módulos (clientes, POS)
  la consumen para su propio historial.
- El estado en memoria de este módulo (`src/store/CotizacionesContext.tsx`) inicializa con
  ese catálogo y agrega/actualiza cotizaciones durante la sesión del navegador.

## Correr el módulo

```bash
pnpm install
pnpm --filter @scipos/cotizaciones-front dev   # http://localhost:3005
```
