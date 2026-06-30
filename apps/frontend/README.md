# Frontend de SCIPOS

Microfrontends como **aplicaciones separadas** (Next.js + TypeScript + MUI),
integradas por el `web-shell`, que es el host de navegación y layout.

## Estructura

| Carpeta | Responsable | Qué es |
|---|---|---|
| `commons/` | Leobardo | Design System: tema MUI, componentes base, permisos, datos de catálogo, utils |
| `web-shell/` | Leobardo | Host: navegación, layout, selector de rol, dashboard |
| `example-front/` | Leobardo | Plantilla de referencia para los `*-front` |
| `productos-front/` | José Arias | Catálogo de productos y servicios |
| `clientes-front/` | Jassiel Paredes | Gestión de clientes |
| `cotizaciones-front/` | Ángel Aguilar | Cotizaciones + conversión a venta |
| `pos-caja-front/` | Alejandro Torres | Punto de venta + caja |

> Los `*-front` de los compañeros se crean copiando `example-front`.

## Comandos

```bash
pnpm install                    # instala todo el monorepo (desde la raíz)
pnpm --filter @scipos/web-shell dev      # corre el shell en http://localhost:3001
pnpm --filter @scipos/example-front dev  # corre la plantilla en http://localhost:3002
pnpm build                      # build de todo
pnpm lint                       # lint con Biome
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
