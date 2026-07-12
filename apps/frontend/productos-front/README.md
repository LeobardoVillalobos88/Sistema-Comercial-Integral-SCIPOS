# productos-front: catálogo de productos y servicios

Microfrontend del módulo de Productos (RF-07, RF-08, RF-09).

## Correrlo solo

```bash
pnpm install
pnpm --filter @scipos/productos-front dev   # http://localhost:3003
```

## Qué hace

- Lista el catálogo (`PRODUCTOS_MOCK` de `@scipos/frontend-commons`) con búsqueda y
  filtros por **estado** (activo/inactivo) y **tipo** (producto/servicio).
- **Alta y edición** vía un modal con los campos lote, nombre, tipo, precio de
  compra, precio de venta, existencia, fecha de caducidad y estado, con
  validaciones en tiempo real.
- **Desactivar/activar** (baja lógica) y **eliminar** (solo Administrador, con
  confirmación).
- Las acciones se ocultan según el rol activo con
  `<Permiso requiere="productos:...">` — ver `@scipos/frontend-commons/permisos`.
- Notificaciones toast al guardar o cambiar estado.

## Integración en el web-shell

`apps/frontend/web-shell/src/app/productos/page.tsx` importa `<CatalogoProductos />`
directamente desde este paquete.
