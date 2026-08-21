# Frontend de SCIPOS

Microfrontends como **aplicaciones separadas** (Next.js + TypeScript + MUI),
integradas por el `web-shell`, que es el host de navegación y layout.

## Estructura

| Carpeta | Puerto | Qué es |
|---|---|---|
| `commons/` | — | Design System: tema MUI, componentes base, permisos, feedback (toasts/alertas), datos de catálogo, utils |
| `web-shell/` | 3001 | Host: navegación, layout, sesión (login/logout), landing (Inicio), dashboard y admin de usuarios |
| `login-front/` | — | Pantalla de inicio de sesión; se monta en `/login` del `web-shell` (componente puro, sin puerto propio) |
| `productos-front/` | 3003 | Catálogo de productos y servicios (lote, caducidad, precios de compra/venta, CRUD) |
| `clientes-front/` | 3004 | Gestión de clientes + detalle con historial de cotizaciones y ventas |
| `cotizaciones-front/` | 3005 | Cotizaciones (Borrador → Enviada → Vendida) y conversión a venta |
| `pos-caja-front/` | 3006 | Punto de venta, punto de compra y caja (apertura, movimientos, corte) |
| `reportes-front/` | 3007 | Reportes (ventas, cotizaciones, inventario valuado, cortes, utilidad) con exportación CSV. Tres privilegios: `reportes:ver`, `reportes:utilidad` y `reportes:exportar` |

> Cada `*-front` corre en su propio puerto (3003–3007).

## Comandos

```bash
pnpm install                                  # instala todo el monorepo (desde la raíz)
pnpm dev                                      # corre TODO a la vez (vía Turbo)
pnpm --filter @scipos/web-shell dev           # solo el shell        → http://localhost:3001
pnpm --filter @scipos/productos-front dev     # solo productos       → http://localhost:3003
pnpm --filter @scipos/clientes-front dev      # solo clientes        → http://localhost:3004
pnpm --filter @scipos/cotizaciones-front dev  # solo cotizaciones    → http://localhost:3005
pnpm --filter @scipos/pos-caja-front dev      # solo POS + caja      → http://localhost:3006
pnpm --filter @scipos/reportes-front dev      # solo reportes        → http://localhost:3007
pnpm build                                    # build de todo
pnpm lint                                     # lint con Biome
pnpm --filter @scipos/pos-caja-front test     # importes del punto de venta
```

> `login-front` no tiene servidor propio: se consume desde el `web-shell`. Para
> verlo, levanta el shell y entra a `http://localhost:3001/login`.

## El Design System (`@scipos/frontend-commons`)

Todo lo compartido se importa desde un solo lugar:

```tsx
import {
  PageHeader, SearchableTable, SkeletonTabla, EstadoChip, EstadoCotizacionChip,
  StatCard, Permiso, usePermisos, PRODUCTOS_MOCK, CLIENTES_MOCK,
  formatearMoneda, formatearFecha, formatearFechaConHora, temaScipos, MARCA_OSCURA,
} from "@scipos/frontend-commons";
```

### Colores

`temaScipos` manda: los colores salen de la paleta (`primary.main`, `secondary.main`)
o de rutas del tema en `sx` (`color="primary.main"`), nunca de un hexadecimal escrito
a mano. El menú lateral y la pantalla de acceso son superficies oscuras que no caben
en la paleta clara de MUI, así que sus tonos viven en `MARCA_OSCURA`
(`degradado`, `degradadoHover`, `fondo`, `texto`, `textoTenue`). Si necesitas ese
degradado corporativo, impórtalo de ahí en vez de volver a escribirlo.

### Tablas

`SearchableTable` pide `claveFila` además de `columnas` y `textoBusqueda`. Devuelve
el identificador estable de la fila (normalmente su `id`):

```tsx
<SearchableTable
  filas={productos}
  columnas={columnas}
  claveFila={(p) => p.id}
  textoBusqueda={(p) => `${p.lote} ${p.nombre}`}
/>
```

La lista se reordena mientras el usuario escribe en el buscador; con la posición como
clave, React conservaría el estado de una fila y lo mostraría en el registro
equivocado.

### Sesión y permisos

La sesión es real: la pantalla de `/login` llama a `iniciarSesion(correo, contrasena)`
del contexto de permisos, que obtiene un token JWT del servicio de seguridad. A
partir de ahí, cada módulo muestra u oculta acciones según los privilegios del
usuario, y el **backend valida cada acción** (ocultar en el frontend nunca basta).
Sin sesión, el `web-shell` redirige a `/login`; el botón de cerrar sesión del menú
lateral llama a `cerrarSesion()`.

```tsx
const { can, usuario, cerrarSesion } = usePermisos();

{can("productos:crear") && <Button>Nuevo</Button>}
// o, de forma declarativa:
<Permiso requiere="productos:crear"><Button>Nuevo</Button></Permiso>
```

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
sus datos (mientras la petición al backend está en curso).

Cuando el aviso trae una lista y no cabe en una línea está `alertaDetallada`. Su
cuerpo es HTML, así que **todo dato que venga de la base pasa antes por
`escaparHtml`**: sin eso, un nombre de producto con `<` rompería el modal y sería
una vía de inyección.

```tsx
import { alertaDetallada, escaparHtml } from "@scipos/frontend-commons/feedback";

await alertaDetallada({
  titulo: "Revisa tu inventario",
  html: `<ul><li>${escaparHtml(producto.nombre)}</li></ul>`,
  confirmar: "Ir a Productos",
  cancelar: "Entendido",
});
```

### Campos de selección

Cuando la lista de opciones crece con el catálogo —clientes, productos, cualquier
cosa que pueda llegar a cien— usa `SelectBuscable` en vez de un `Select`: además
de desplegarse, se puede escribir para filtrar, y lleva lupa en lugar de flecha
para que se note.

```tsx
<SelectBuscable
  etiqueta="Cliente"
  opciones={clientes}
  valor={cliente}
  onCambio={setCliente}
  obtenerEtiqueta={(c) => c.nombre}
  obtenerClave={(c) => c.id}
/>
```

Pasa siempre `obtenerClave`: al recargar la lista desde la API llegan objetos
nuevos, y comparar por identidad dejaría el campo en blanco.

Las listas cortas y fijas (estado, tipo, rol, tipo de movimiento) se quedan como
`Select` normal a propósito: buscar entre dos opciones estorba.

### Pantallas de error

`PaginaError` pinta las fallas de navegación a página completa, y `CONTENIDO_ERROR`
guarda el texto de cada código en un solo lugar. El web-shell las cablea: 404 por
`not-found.tsx`, 500 por la frontera de error, 403 cuando entras por URL a un
módulo sin privilegio, 401 cuando la sesión se vence y 503 cuando el servidor no
contesta.

Un error a media tarea dentro de un módulo **no** usa estas pantallas: eso es un
toast. Sacar al usuario de lo que estaba haciendo sería peor que el error.

### Convención de acciones en tablas

Orden fijo de los botones de acción: **Ver → Activar/Desactivar → Editar →
Eliminar** (se omiten los que no apliquen). Colores: ver `primary`, editar
`info`, activar `success`, eliminar `error`. Eliminar siempre pide
confirmación y es exclusivo del Administrador (privilegio `modulo:eliminar`).
```