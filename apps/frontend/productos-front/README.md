# productos-front: catálogo de productos y servicios

Microfrontend del módulo de Productos (RF-07, RF-08, RF-09). Responsable: José Arias
(rama `feature/productos-catalogo`).

## Correrlo solo

```bash
pnpm install
pnpm --filter @scipos/productos-front dev   # http://localhost:3002
```

## Qué hace

- Lista el catálogo (`PRODUCTOS_MOCK` de `@scipos/frontend-commons`) con búsqueda y
  filtros por **estado** (activo/inactivo) y **tipo** (producto/servicio).
- **Alta y edición** vía un modal con los campos lote, nombre, tipo, precio,
  existencia, fecha de caducidad y estado. El precio no admite valores negativos.
- **Desactivar/activar** (baja lógica, nunca se borra el registro).
- Las acciones (`Nuevo`, `Editar`, `Desactivar`) se ocultan según el rol mock activo
  con `<Permiso requiere="productos:...">` — ver `@scipos/frontend-commons/permisos`.

Los datos son mock y viven solo en memoria del componente (`useState`); no hay
persistencia ni backend todavía.

## Integrarlo al web-shell

Cuando el módulo esté listo, reemplaza el placeholder
`apps/frontend/web-shell/src/app/productos/page.tsx`
(`<ModuloEnConstruccion>`) con `<CatalogoProductos />` de este paquete, siguiendo el
flujo de integración del equipo (fase 2: PR contra `develop`).
