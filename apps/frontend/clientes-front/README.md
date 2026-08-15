# clientes-front

Microfrontend de **gestión de clientes** (RF-10 a RF-12).

## Qué hace

- **Listado de clientes**: búsqueda y filtro por estado (activo/inactivo), cargado
  desde la API; `SkeletonTabla` mientras carga.
- **Alta y edición** en un diálogo, con validación en tiempo real del teléfono
  (10 dígitos) y RFC; el backend vuelve a validar.
- **Activar/desactivar** (baja lógica) y **eliminar** definitivo (solo Administrador,
  con confirmación y toast).
- **Detalle con historial**: diálogo con pestañas que muestran las cotizaciones y
  ventas del cliente; si un servicio fuente está caído, muestra los datos parciales.

Todas las acciones sensibles están controladas con `usePermisos()` /
`<Permiso requiere="clientes:...">` de `@scipos/frontend-commons`; el backend valida
cada una con `@RequierePrivilegio`, así que ocultar el botón no basta.

## Backend

Todas las llamadas usan `llamarApi` de `@scipos/frontend-commons` y pasan por el gateway:

- `GET /api/clientes` (listar + buscar) y `GET /api/clientes/:id/historial`
- `POST /api/clientes`
- `PATCH /api/clientes/:id` y `PATCH /api/clientes/:id/estado`
- `DELETE /api/clientes/:id`

El servicio de clientes vive en `apps/backend/services/clientes`
(`@scipos/clientes-service`, puerto 4003). El historial necesita además cotizaciones
(4004) y ventas-caja (4005) disponibles.

## Correr el módulo

```bash
pnpm install
pnpm --filter @scipos/clientes-front dev   # http://localhost:3004
```

La URL base del gateway se puede cambiar con `NEXT_PUBLIC_API_URL`; por defecto es
`http://localhost:4000/api`.

## Integración en el web-shell

`apps/frontend/web-shell/src/app/clientes/page.tsx` importa el componente principal
directamente desde este paquete.
