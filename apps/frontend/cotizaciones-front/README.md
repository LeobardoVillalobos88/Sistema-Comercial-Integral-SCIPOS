# cotizaciones-front

Microfrontend de **Cotizaciones + conversión a venta** (Ángel Aguilar, `feature/cotizaciones-flujo`).

## Qué hace

- **Listado de cotizaciones** (`/`): búsqueda, filtro por cliente (historial por cliente, RF-16) y
  por estado (Borrador/Enviada/Convertida).
- **Nueva cotización** (`/nueva-cotizacion`): selecciona cliente (`CLIENTES_MOCK`), agrega productos
  (`PRODUCTOS_MOCK`) con cantidad, calcula subtotal por partida y total, y genera el folio
  automático (`COT-AAAA-000N`).
- **Detalle de cotización** (`/[id]`): muestra partidas y total, y permite **convertir a venta**
  sin recapturar datos (RF-17) — marca la cotización como `CONVERTIDA` y muestra la venta generada.

Todas las acciones sensibles (crear, convertir) están controladas con `usePermisos()` /
`<Permiso requiere="...">` de `@scipos/frontend-commons`.

## Datos mock

- `COTIZACIONES_MOCK` vive en `@scipos/frontend-commons` (`apps/frontend/commons/src/mocks/cotizaciones.ts`)
  porque otros módulos (clientes, POS) la consumen para su propio historial/conversión.
- El estado en memoria de este módulo (`src/store/CotizacionesContext.tsx`) inicializa con ese mock
  y agrega/actualiza cotizaciones durante la sesión del navegador (sin backend).

## Correr el módulo

```bash
pnpm install
pnpm --filter @scipos/cotizaciones-front dev   # http://localhost:3005
```
