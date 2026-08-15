# productos-front: catálogo de productos y servicios

Microfrontend del módulo de Productos (RF-07, RF-08, RF-09).

## Correrlo solo

```bash
pnpm install
pnpm --filter @scipos/productos-front dev   # http://localhost:3003
```

## Qué hace

- Lista el catálogo consultando `GET /productos` del servicio de productos
  (a través del gateway) con búsqueda y filtros por **estado** (activo/inactivo)
  y **tipo** (producto/servicio); muestra `SkeletonTabla` mientras carga.
- **Alta y edición** vía un modal con los campos lote, nombre, tipo, precio de
  compra, precio de venta, existencia, fecha de caducidad y estado, con
  validaciones en tiempo real; guarda contra `POST /productos` y
  `PATCH /productos/:id` (más `PATCH /productos/:id/estado` si cambia el estado).
- **Desactivar/activar** (`PATCH /productos/:id/estado`, baja lógica) y
  **eliminar** (`DELETE /productos/:id`, solo Administrador, con confirmación).
- Las acciones se ocultan según el rol activo con
  `<Permiso requiere="productos:...">` — ver `@scipos/frontend-commons/permisos`.
  El backend valida cada acción con `@RequierePrivilegio` en
  `apps/backend/services/productos`, así que ocultar el botón no basta: la
  API responde 401/403 igual si se fuerza la petición.
- Notificaciones toast al guardar, cambiar estado o si la API falla.

## Backend

El servicio de productos vive en `apps/backend/services/productos`
(`@scipos/productos-service`, puerto 4002, schema `productos`). Para levantarlo:

```bash
pnpm --filter @scipos/productos-service prisma:migrate
pnpm --filter @scipos/productos-service seed
pnpm --filter @scipos/productos-service dev
```

## Integración en el web-shell

`apps/frontend/web-shell/src/app/productos/page.tsx` importa `<CatalogoProductos />`
directamente desde este paquete.
