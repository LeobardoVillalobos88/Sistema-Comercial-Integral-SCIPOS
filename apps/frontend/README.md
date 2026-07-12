# Frontend de SCIPOS

Microfrontends como **aplicaciones separadas** (Next.js + TypeScript + MUI),
integradas por el `web-shell`, que es el host de navegación y layout.

## Estructura

| Carpeta | Puerto | Qué es |
|---|---|---|
| `commons/` | — | Design System: tema MUI, componentes base, permisos, feedback (toasts/alertas), datos de catálogo, utils |
| `web-shell/` | 3001 | Host: navegación, layout, selector de rol, landing (Inicio) y dashboard |
| `example-front/` | 3002 | Plantilla de referencia para los `*-front` |
| `productos-front/` | 3003 | Catálogo de productos y servicios (lote, caducidad, precios de compra/venta, CRUD) |
| `clientes-front/` | 3004 | Gestión de clientes + detalle con historial de cotizaciones y ventas |
| `cotizaciones-front/` | 3005 | Cotizaciones (Borrador → Enviada → Vendida) y conversión a venta |
| `pos-caja-front/` | 3006 | Punto de venta, punto de compra y caja (apertura, movimientos, corte) |

> Los `*-front` se crean copiando `example-front`. El siguiente puerto libre es el **3007**.

## Comandos

```bash
pnpm install                                  # instala todo el monorepo (desde la raíz)
pnpm dev                                      # corre TODO a la vez (vía Turbo)
pnpm --filter @scipos/web-shell dev           # solo el shell        → http://localhost:3001
pnpm --filter @scipos/example-front dev       # solo la plantilla    → http://localhost:3002
pnpm --filter @scipos/productos-front dev     # solo productos       → http://localhost:3003
pnpm --filter @scipos/clientes-front dev      # solo clientes        → http://localhost:3004
pnpm --filter @scipos/cotizaciones-front dev  # solo cotizaciones    → http://localhost:3005
pnpm --filter @scipos/pos-caja-front dev      # solo POS + caja      → http://localhost:3006
pnpm build                                    # build de todo
pnpm lint                                     # lint con Biome
```

## El Design System (`@scipos/frontend-commons`)

Todo lo compartido se importa desde un solo lugar:

```tsx
import {
  PageHeader, SearchableTable, SkeletonTabla, EstadoChip, EstadoCotizacionChip,
  StatCard, Permiso, usePermisos, PRODUCTOS_MOCK, CLIENTES_MOCK,
  formatearMoneda, formatearFecha, formatearFechaConHora, totalCotizacion, temaScipos,
} from "@scipos/frontend-commons";
```

### Permisos

```tsx
const { rol, can } = usePermisos();

{can("productos:crear") && <Button>Nuevo</Button>}
// o, de forma declarativa:
<Permiso requiere="productos:crear"><Button>Nuevo</Button></Permiso>
```

El selector de rol del `web-shell` cambia el rol activo y los módulos reaccionan
mostrando u ocultando acciones según los privilegios de ese rol.

### Feedback (toasts, alertas y skeletons)

```tsx
import { useToast, confirmar } from "@scipos/frontend-commons/feedback";

const toast = useToast();
toast.exito("Guardado.");   // verde con check
toast.error("Algo falló."); // rojo con equis
toast.info("Ojo con esto.");// azul con exclamación

// Confirmación (sweet alert) antes de una acción sensible:
if (await confirmar({ titulo: "¿Eliminar registro?" })) { /* ... */ }
```

Para estados de carga está `SkeletonTabla`: renderízalo mientras la vista espera
sus datos (al integrar el backend, mientras la petición está en curso).

### Convención de acciones en tablas

Orden fijo de los botones de acción: **Ver → Activar/Desactivar → Editar →
Eliminar** (se omiten los que no apliquen). Colores: ver `primary`, editar
`info`, activar `success`, eliminar `error`. Eliminar siempre pide
confirmación y es exclusivo del Administrador (privilegio `modulo:eliminar`).
