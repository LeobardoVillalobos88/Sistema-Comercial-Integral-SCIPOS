# Web shell

`@scipos/web-shell` (puerto **3001**). El armazón: la única aplicación que se
publica. Embebe los microfrontends de dominio y les da sesión, menú y tema.

## Qué contiene

`src/components/AppShell.tsx` arma barra superior, menú lateral y área de
contenido, y decide qué se ve antes de dejar pasar a cualquier módulo:

| Situación | Qué pinta |
| --- | --- |
| No hay sesión | Redirige a `/login` |
| El servidor no contestó al restaurar la sesión | Pantalla 503 |
| La sesión venció y el refresh ya no sirve | Pantalla 401 |
| La ruta pide un privilegio que el usuario no tiene | Pantalla 403 dentro del marco |

El login y las pantallas de error se pintan **fuera** del armazón: si pasaran por
él, un 401 dispararía la redirección al login antes de que alguien alcanzara a
leerlo.

`src/config/navegacion.ts` es la única fuente del menú: cada módulo declara su
ruta, su icono y el privilegio que exige, y el menú se dibuja filtrando esa lista
con los privilegios que devolvió el backend.

## Rutas

`/inicio`, `/dashboard`, `/productos`, `/clientes`, `/cotizaciones`, `/pos`,
`/compras`, `/caja`, `/reportes`, `/usuarios`, `/login` y `/error/401|403|404|500|503`.

`/usuarios` es la única pantalla de dominio que vive aquí y no en un paquete
aparte: es la interfaz del servicio de seguridad, que es transversal a todos los
módulos.

## Cómo se integra un microfrontend

Tres pasos, y el armazón no cambia:

1. Agregarlo como dependencia `workspace:*` en `package.json`.
2. Listarlo en `transpilePackages` de `next.config.mjs`.
3. Importar su componente raíz en el `page.tsx` de la ruta.

```tsx
import { CatalogoProductos } from "@scipos/productos-front";
```

## Cuidado al editar el layout

El `<Box component="main">` del armazón lleva `minWidth: 0`, y **no se debe
quitar**. Un ítem flex arranca con `min-width: auto`, o sea que se niega a
encogerse por debajo del ancho de su contenido: con una tabla ancha adentro, el
área crecía hasta medir lo que la tabla y arrastraba consigo a toda la página
—922 px dentro de una pantalla de 375—, y el `TableContainer` nunca llegaba a
desplazarse porque su padre le cedía el espacio.

## Desarrollo local

```bash
pnpm --filter @scipos/web-shell dev
```

Necesita el gateway (4000) y los servicios arriba. Lo mínimo está en el
[README raíz](../../../README.md).
