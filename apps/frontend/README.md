# Frontend de SCIPOS

Microfrontends como **aplicaciones separadas** (Next.js + TypeScript + MUI),
integradas por el `web-shell`, que es el host de navegación y layout.

## Estructura

| Carpeta | Responsable | Puerto | Qué es |
|---|---|---|---|
| `commons/` | Leobardo | — | Design System: tema MUI, componentes base, permisos, datos de catálogo, utils |
| `web-shell/` | Leobardo | 3001 | Host: navegación, layout, selector de rol, dashboard |
| `example-front/` | Leobardo | 3002 | Plantilla de referencia para los `*-front` |
| `productos-front/` | José Arias | 3003 | Catálogo de productos y servicios (buscar, filtrar, alta/edición, activar/desactivar) |
| `clientes-front/` | Jassiel Paredes | 3004 | Gestión de clientes + detalle con historial de cotizaciones y ventas |
| `cotizaciones-front/` | Ángel Aguilar | 3005 | Cotizaciones (Borrador → Enviada → Vendida) y conversión a venta |
| `pos-caja-front/` | Alejandro Torres | 3006 | Punto de venta + caja (apertura, movimientos, corte) |

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
  PageHeader, SearchableTable, EstadoChip, StatCard, Permiso,
  usePermisos, PRODUCTOS_MOCK, CLIENTES_MOCK, formatearMoneda, temaScipos,
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
