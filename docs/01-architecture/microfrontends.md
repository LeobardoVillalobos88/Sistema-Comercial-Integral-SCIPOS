# Arquitectura del frontend (SOFEA + microfrontends)

Responde las seis preguntas guía del enunciado. Cada respuesta apunta al archivo
donde se puede comprobar.

---

## ¿Cuál es el contenedor principal del frontend?

**`apps/frontend/web-shell`** (`@scipos/web-shell`, puerto 3001). Es una
aplicación Next.js con App Router y es lo único que se publica: la dirección del
sistema apunta ahí.

Su pieza central es `src/components/AppShell.tsx`, que arma barra superior, menú
lateral y área de contenido, y además decide tres cosas antes de dejar pasar a
cualquier módulo:

| Situación | Qué hace el armazón |
|---|---|
| No hay sesión | Redirige a `/login` |
| El servidor no contestó al restaurar la sesión | Pinta la pantalla 503 |
| La sesión venció y el refresh ya no sirve | Pinta la pantalla 401 |
| La ruta pide un privilegio que el usuario no tiene | Pinta la 403 dentro del marco |

Ese último caso importa: el menú ya esconde los módulos ajenos, pero escribir la
dirección a mano no lo impedía. El backend rechaza la acción de todos modos; la
pantalla existe para que la persona lea por qué en vez de encontrarse un espacio
vacío.

Las pantallas de error y el login se pintan **fuera** del armazón. Si pasaran por
él, un 401 dispararía la redirección al login antes de que alguien alcanzara a
leerlo.

## ¿Qué módulos frontend existen?

Cinco microfrontends de dominio, más la pantalla de acceso y la biblioteca común:

| Paquete | Puerto propio | Qué resuelve |
|---|---|---|
| `@scipos/productos-front` | 3003 | Catálogo, lotes, caducidades, alertas de inventario |
| `@scipos/clientes-front` | 3004 | Clientes y su historial de cotizaciones y ventas |
| `@scipos/cotizaciones-front` | 3005 | Cotizaciones y su ciclo borrador → enviada → vendida |
| `@scipos/pos-caja-front` | 3006 | Punto de venta, punto de compra y caja |
| `@scipos/reportes-front` | 3007 | Los cinco reportes, con filtro y descarga |
| `@scipos/login-front` | — | La pantalla de acceso (componente puro, sin ruta propia) |
| `@scipos/frontend-commons` | — | Sistema de diseño, permisos, cliente de API, avisos |

La administración de usuarios (`/usuarios`) es una página dentro del armazón y no
un paquete aparte: es la interfaz del servicio de seguridad, que ya es
transversal a todos los módulos.

**Cada uno es una aplicación Next.js completa.** Tiene su `src/app/layout.tsx`,
su `page.tsx`, sus providers y su `build`. Se levanta sin el armazón:

```bash
pnpm --filter @scipos/pos-caja-front dev    # el POS solo, en el 3006
pnpm --filter @scipos/reportes-front dev    # los reportes solos, en el 3007
```

Esa es la prueba de que la separación es real y no una convención de carpetas.

### Cómo se integran

El armazón los consume como dependencias del workspace y los transpila:

```jsonc
// web-shell/package.json
"@scipos/pos-caja-front": "workspace:*"
```
```js
// web-shell/next.config.mjs
transpilePackages: ["@scipos/pos-caja-front", …]
```
```tsx
// web-shell/src/app/pos/page.tsx
import { PosCajaPage } from "@scipos/pos-caja-front";
```

Ese import es todo el contrato de integración: cada módulo exporta un componente
raíz y el armazón lo monta en su ruta. Sumar un módulo nuevo son tres pasos —el
paquete, los dos registros de arriba, y un renglón en `navegacion.ts`— y el
armazón no cambia.

**Ningún microfrontend importa a otro.** Todos dependen de `commons`; entre
hermanos, nada. Es lo que evita que "módulos separados" se vuelva un nudo con
nombres bonitos.

## ¿Cómo consumen APIs?

Por un único camino: `llamarApi()` de
`apps/frontend/commons/src/api/clienteApi.ts`. Ningún módulo llama a `fetch` por
su cuenta.

Esa función se encarga de lo que ninguna pantalla debería tener que saber:

- apunta al gateway (`NEXT_PUBLIC_API_URL`, que en el despliegue es `/api`);
- firma cada petición con el access token de la sesión;
- ante un 401, renueva con el refresh y **reintenta una vez**, de forma
  transparente;
- si ya no hay nada que rescatar, avisa a la sesión para que el armazón pinte la
  pantalla de sesión terminada;
- lanza `ErrorApi` con el mensaje en español que mandó el backend, para que la
  pantalla lo muestre tal cual en vez de inventar uno.

Hay una sola promesa de refresco compartida (`refrescoEnCurso`). Sin eso, tres
peticiones que vencen a la vez lanzarían tres renovaciones simultáneas peleándose
por rotar el mismo refresh token —y la rotación interpreta el uso repetido como
robo y cierra la sesión entera. El síntoma sería un cierre de sesión aleatorio en
las pantallas que cargan varias cosas a la vez.

`ErrorApi.esDeConectividad` distingue "el servidor contestó con un error" de "el
servidor no contestó". El armazón convierte lo segundo en la pantalla 503; son
dos problemas distintos y merecen dos explicaciones distintas.

Para archivos hay dos funciones hermanas: `descargarArchivo()` devuelve el blob
—la usa el comprobante PDF, que se abre en otra pestaña— y `guardarArchivo()`
dispara la descarga —la usa la exportación de reportes—. Las dos leen el mensaje
del backend cuando falla, porque el cuerpo de un error sigue siendo JSON aunque
la petición pidiera un archivo.

## ¿Qué estado es local y qué estado es global?

**Global**, en providers del armazón, porque lo necesita todo el sistema:

| Estado | Dónde vive |
|---|---|
| Sesión, usuario y privilegios efectivos | `PermisosProvider` (`commons/permisos`) |
| Avisos y confirmaciones | `ToastProvider` (`commons/feedback`) |
| Tema visual | `temaScipos` (`commons/theme`) |

**Local a cada módulo**, porque fuera de él no significa nada:

| Estado | Dónde vive |
|---|---|
| Carrito, descuento y totales del POS | `useCarrito` (`pos-caja-front/src/hooks`) |
| Turno de caja abierto y sus movimientos | `CajaContext` (`pos-caja-front/src/context`) |
| Lista y filtros de cotizaciones | `CotizacionesContext` (`cotizaciones-front`) |
| Búsquedas, filtros y diálogos de cada tabla | `useState` de la pantalla |

**El criterio.** Sube a global lo que dos módulos necesitan a la vez y tiene que
coincidir entre ellos. El carrito no: si el módulo de clientes pudiera tocarlo,
el POS dejaría de ser responsable de sus propios números.

Un detalle que se decidió a propósito: `CajaContext` **rehidrata el turno abierto
desde `GET /ventas-caja/caja/estado` al montarse**, en vez de confiar en lo que
guardó el navegador. Recargar la página con la caja abierta no puede perder el
turno, y el estado real de la caja está en el servidor, no en la pestaña.

## ¿Cómo se muestran u ocultan funciones por privilegio?

En tres niveles, y el cuarto es el que de verdad protege.

**1. El menú.** `web-shell/src/config/navegacion.ts` declara por módulo la ruta,
el icono y el privilegio que exige. El menú lateral se dibuja filtrando esa lista
con los privilegios del usuario. Un cajero no ve *Cotizaciones* ni *Punto de
compra*; un vendedor no ve *Caja*.

**2. Los botones.** Dos formas, según cómo se lea mejor:

```tsx
{can("productos:crear") && <Button>Nuevo</Button>}
<Permiso requiere="productos:crear"><Button>Nuevo</Button></Permiso>
```

**3. La ruta.** Entrar escribiendo la dirección de un módulo ajeno da la pantalla
403 dentro del marco.

**4. El backend.** Lo único que protege de verdad. Cada endpoint sensible lleva
`@RequierePrivilegio("modulo:accion")` y el guard responde 401 sin identidad y
403 sin privilegio.

**La regla que mantiene los cuatro niveles de acuerdo:** si un botón está detrás
de `can("x:y")`, su endpoint tiene que estar detrás de
`@RequierePrivilegio("x:y")`. Sin excepciones. Los tres primeros niveles son
comodidad —que nadie pulse algo que le van a rechazar—; el cuarto es la
seguridad.

Los privilegios se descargan del backend
(`GET /seguridad/usuarios/:id/privilegios`) al iniciar sesión. Si la API no
responde, `PermisosProvider` cae a la matriz local de `matriz.ts` y lo declara en
`origenPermisos: "local"`. Es un respaldo para que la interfaz siga navegable, no
una autorización: el backend valida igual.

**Cómo se demuestra que es dinámico y no un rol disfrazado.** Desde `/usuarios`,
con una cuenta de administrador, se le revoca un privilegio a un usuario
concreto. En su siguiente sesión el botón desapareció y el endpoint le responde
403. No se tocó código, ni se cambió de rol. La revocación individual le gana
incluso al rol de administrador con acceso total —esa regla está fijada por
prueba en `privilegios.service.spec.ts`.

## ¿Cómo mantienen un diseño consistente?

Todo lo compartido vive en `@scipos/frontend-commons` y se importa por subrutas
(`/theme`, `/permisos`, `/components`, `/feedback`, `/mocks`). Es un paquete solo
de fuentes: no se compila, el armazón lo transpila.

- **Tema.** `temaScipos` exporta los tokens del mundo visual descrito en
  `DESIGN.md`: `ESMALTE`, `PLANO`, `SOBRE_ESMALTE`, `sombraRotulo()`, `CIFRA`.
  Nadie vuelve a escribir un hexadecimal a mano.
- **Componentes.** `PageHeader`, `SearchableTable`, `SkeletonTabla`,
  `SelectBuscable`, `StatCard`, `EstadoChip`, `PaginaError`, `Permiso`.
- **Avisos.** `useToast` para los mensajes de arriba a la derecha; `confirmar()`,
  `alertaExito()`, `alertaError()` y `alertaDetallada()` para los diálogos.
- **Formato.** `formatearMoneda`, `formatearFecha`, `formatearFechaConHora`.

Hay convenciones que no son código pero se respetan igual. La de las tablas:
los botones de acción van siempre en el mismo orden —**Ver (ojo) → Activar o
desactivar (interruptor) → Editar (lápiz) → Eliminar (bote)**— omitiendo los que
el módulo no tenga. Eliminar siempre pide confirmación y siempre avisa después.
Cinco módulos escritos por personas distintas se sienten como uno solo porque el
orden no cambia de pantalla a pantalla.

Una advertencia de seguridad que vive aquí: `alertaDetallada()` inserta su cuerpo
como HTML, así que **todo valor que venga de la base pasa antes por
`escaparHtml()`**. Un producto llamado `<img onerror=...>` es un guion ejecutándose
en la sesión de quien lo lea.

## Diseño adaptable

Sin Bootstrap: chocaría con MUI, que es el obligatorio. Se usan los puntos de
corte de MUI (`xs`, `sm`, `md`, `lg`).

- El menú lateral es un cajón temporal en móvil, abierto desde el botón de la
  barra superior, y una franja fija que se expande y contrae en escritorio.
- Las rejillas de tarjetas pasan de una columna a dos y a cuatro según el ancho.
- Las tablas van dentro de `TableContainer`, que desplaza en horizontal cuando no
  cabe: la fila completa sigue siendo legible en un teléfono sin que la página se
  desborde.
- Los filtros con dos o tres campos se apilan en vertical en móvil
  (`direction={{ xs: "column", sm: "row" }}`).
- Las pestañas son desplazables con botones en móvil, que es lo que hace usable
  el panel de reportes en una pantalla angosta.
