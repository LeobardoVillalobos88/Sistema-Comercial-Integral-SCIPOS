# Frontend commons

`@scipos/frontend-commons`. Sistema de diseño y biblioteca compartida de todo el
frontend. **Todo lo común se importa de aquí**; ningún microfrontend define su
propia tabla, su propio encabezado ni su propio cliente de API.

Es un paquete **solo de fuentes**: `main` y `types` apuntan a `src/index.ts` y no
hay paso de construcción. Los consumidores lo transpilan con `transpilePackages`
de Next. Al revés que `apps/backend/commons`, que sí se compila a `dist/`, y por
eso las dos bibliotecas nunca se cruzan.

## Qué exporta, y por dónde

| Subruta | Contenido |
| --- | --- |
| `@scipos/frontend-commons` | El barril: componentes, utilidades, permisos y cliente de API |
| `/theme` | `temaScipos` y los tokens: `ESMALTE`, `PLANO`, `SOBRE_ESMALTE`, `sombraRotulo()`, `CIFRA` |
| `/permisos` | `PermisosProvider`, `usePermisos`, `MATRIZ_PRIVILEGIOS` |
| `/components` | `PageHeader`, `SearchableTable`, `SkeletonTabla`, `SelectBuscable`, `StatCard`, `EstadoChip`, `PaginaError`, `Permiso` |
| `/feedback` | `useToast`, `confirmar()`, `alertaExito()`, `alertaError()`, `alertaDetallada()`, `escaparHtml()` |
| `/mocks` | Respaldo sin conexión de `/inicio` y del dashboard cuando su servicio no responde |

## Las tres piezas que hay que conocer antes de tocar nada

**`clienteApi.ts`.** `llamarApi()` es el único camino del frontend hacia el
backend. Firma con el token, renueva ante un 401 y reintenta **una** vez, y
lanza `ErrorApi` con el mensaje en español del backend. Hay una sola promesa de
refresco compartida a propósito: varias renovaciones simultáneas peleándose por
rotar el mismo refresh token es justo lo que la rotación interpreta como robo, y
castiga cerrando la sesión. Para archivos están `descargarArchivo()` (devuelve el
blob) y `guardarArchivo()` (dispara la descarga).

**`PermisosProvider.tsx`.** Guarda la sesión y reparte los privilegios efectivos
que descargó del backend. Si la API no responde, cae a `matriz.ts` y lo declara
en `origenPermisos: "local"`: es para que la interfaz siga navegable, no para
autorizar nada.

**`escaparHtml()`.** `alertaDetallada()` inserta su cuerpo como HTML, así que
**todo valor que venga de la base pasa antes por aquí**. Un producto llamado
`<img onerror=...>` es un guion ejecutándose en la sesión de quien lo lea.

## Convenciones que viven aquí

- `SearchableTable` exige `claveFila`, el identificador estable del registro. La
  lista se reordena al filtrar, y con una clave posicional React reutiliza la
  fila —y su estado— para un registro distinto: en una tabla con acciones, eso
  significa pulsar *eliminar* sobre el producto equivocado.
- Los botones de acción van siempre en el mismo orden: **Ver → Activar o
  desactivar → Editar → Eliminar**, omitiendo los que el módulo no tenga.
- `SelectBuscable` sustituye al select simple cuando la lista crece con el
  catálogo (clientes, productos). Las listas fijas y cortas —estado, tipo, rol,
  tipo de movimiento— se quedan como select normal: buscar entre dos opciones es
  estorbo, no ayuda.
- `Producto` tiene `lote`, `fechaCaducidad?`, `precioCompra` y `precioVenta`. No
  existe un campo `precio` a secas.
