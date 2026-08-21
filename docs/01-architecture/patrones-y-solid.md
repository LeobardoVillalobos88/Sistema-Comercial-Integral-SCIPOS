# Patrones de diseño y principios SOLID

Qué patrones se aplicaron, en qué archivo vive cada uno y qué problema concreto
resuelve. Ninguno está por adorno: en cada caso hubo primero un problema y
después el patrón, y donde no hubo problema no se metió patrón.

Todo lo que se afirma aquí se puede abrir y leer. Las referencias son a archivos
y a nombres de función, no a números de línea, para que sigan sirviendo cuando el
código se mueva.

---

## 1. Patrones en el backend

### Strategy — el guard no sabe quién le contesta

**Dónde:** `apps/backend/commons/src/contratos/privilegios.ts` define la interfaz
`ProveedorPrivilegios`. Hay dos implementaciones:
`apps/backend/commons/src/seguridad/proveedor-privilegios-http.ts`, que pregunta
por REST al servicio de seguridad, y la local dentro del propio servicio de
seguridad (`PrivilegiosService.verificar`).

**El problema.** Los siete procesos del backend tienen que validar privilegios
igual, pero no pueden hacerlo igual. Seis consultan al servicio de seguridad por
HTTP. El séptimo *es* el servicio de seguridad: si usara el mismo camino se
llamaría a sí mismo por la red para preguntarse algo que ya tiene en su propia
base, y bastaría con que tardara un poco en arrancar para que se quedara
esperándose a sí mismo.

**La solución.** El guard depende de la interfaz. Cada servicio elige su
implementación al registrar el módulo:

```ts
// Un servicio de dominio cualquiera: consulta por REST (comportamiento por defecto)
ModuloSeguridad.registrar()

// El servicio de seguridad: se responde a sí mismo sin salir a la red
ModuloSeguridad.registrar({ proveedorPrivilegios: ProveedorPrivilegiosLocal })
```

Lo mismo pasa con `ExtractorIdentidad` (token Bearer contra el JWKS, o cabecera
`x-usuario-id` para las llamadas entre servicios) y con `VerificadorDenylist`.

**Por qué mejora el diseño.** `GuardPrivilegios` se escribió una vez y no se ha
vuelto a tocar por este motivo. Añadir una tercera forma de resolver privilegios
—una caché local, un modo de pruebas sin red— es escribir una clase que cumpla la
interfaz y nombrarla al registrar el módulo. El guard ni se entera.

### Módulo dinámico (variante de Factory Method) — configurar sin duplicar

**Dónde:** `apps/backend/commons/src/seguridad/modulo-seguridad.ts`.

`ModuloSeguridad.registrar(opciones)` no es una clase que se instancia: es una
fábrica que devuelve un `DynamicModule` ya armado, con el guard puesto como
`APP_GUARD` global y las tres estrategias resueltas.

**El problema que evita.** Sin esto, cada uno de los siete servicios tendría que
repetir en su `AppModule` los cuatro `providers` y el `APP_GUARD`. Siete copias
del mismo bloque es siete lugares donde alguien puede olvidar uno, y un servicio
al que se le olvide registrar el guard queda **con todos sus endpoints
abiertos** sin que nada falle ni avise. Ese es exactamente el tipo de error que
no se descubre hasta que alguien lo aprovecha.

### Decorator — el privilegio se declara junto a lo que protege

**Dónde:** `apps/backend/commons/src/seguridad/requiere-privilegio.decorator.ts`.

```ts
@Post()
@RequierePrivilegio("pos:vender")
crear(@Body() dto: CrearVentaDto, @UsuarioActual() usuarioId: string) { … }
```

El decorador solo escribe metadatos; quien decide es el guard, que los lee con el
`Reflector`. La ventaja es de lectura: el permiso que exige un endpoint se ve en
la misma pantalla que el endpoint, no en una tabla de rutas en otro archivo que
se desincroniza en cuanto alguien renombra una ruta.

`@UsuarioActual()` es el complemento: entrega el identificador que el guard ya
resolvió. Por eso **ningún controlador del sistema lee cabeceras**. Si las
leyera, cada uno tendría su propia idea de qué significa estar identificado.

### Cadena de responsabilidad — tres preguntas en orden

**Dónde:** `GuardPrivilegios.canActivate`.

El guard pregunta en un orden que no es casual:

1. ¿Quién eres? (extractor de identidad) → si no hay respuesta, **401**.
2. ¿Tu sesión sigue viva? (denylist en Redis) → si el token fue revocado, **401**.
3. ¿Tienes el privilegio? (proveedor) → si no, **403**.

El paso 2 existe porque un token firmado sigue siendo válido hasta que expira,
aunque el usuario haya cerrado sesión. Sin la denylist, cerrar sesión sería una
sugerencia: el token seguiría abriendo puertas hasta quince minutos después. Y va
antes que el paso 3 a propósito —consultar privilegios de una sesión ya muerta es
trabajo tirado a la basura.

### Adaptador — un solo lugar donde la red puede fallar

**Dónde:** `apps/backend/commons/src/http/cliente-http.ts`.

`ClienteHttp` envuelve `fetch` y traduce lo que pasa afuera al lenguaje de
adentro: un servicio que no contesta se convierte en `HttpException(503)`, y un
error remoto conserva su estatus y su mensaje en español.

**Por qué importa.** Sin este adaptador, cada servicio que llama a otro tendría
su propio `try/catch`, su propio tiempo de espera y su propia forma de reportar
el fallo. El sistema tiene cinco servicios que se llaman entre sí; serían cinco
criterios distintos para el mismo problema. El tiempo de espera de cinco segundos
también vive aquí: sin él, un servicio caído no da error, simplemente deja la
petición colgada, y el usuario ve una pantalla que gira para siempre.

### Fachada / agregador — un servicio sin base de datos

**Dónde:** `apps/backend/services/reportes/`.

El servicio de reportes **no tiene esquema propio ni migraciones**. Pide ventas a
`ventas-caja`, catálogo a `productos`, cotizaciones a `cotizaciones`, y arma la
respuesta.

**La alternativa que se descartó** era darle acceso de lectura a las tablas de
los demás. Habría sido más rápido de escribir y habría matado la independencia de
los servicios: cualquier cambio de columna en productos rompería reportes en
silencio, y ya no habría seis servicios sino uno repartido en seis carpetas.

### Caché-aparte (cache-aside) con invalidación explícita

**Dónde:** `PrivilegiosService.obtenerPerfil` e `invalidarUsuario` /
`invalidarRol`.

Los privilegios efectivos de un usuario se calculan con dos consultas y varias
uniones, y se preguntan **en cada petición protegida de todo el sistema**. Se
guardan 60 segundos en Redis.

Lo que hace correcto al patrón no es la caché sino la invalidación: cuando se
concede o revoca un privilegio, la entrada del usuario se borra ahí mismo. Sin
eso, quitarle un permiso a alguien tardaría hasta un minuto en surtir efecto —y
un minuto es mucho cuando el permiso se le quita a alguien por una razón.

Si Redis está caído, se consulta la base y se sigue. La caché acelera; no
autoriza.

### Llave de idempotencia + candado — convertir una cotización dos veces

**Dónde:** `CotizacionesService.convertir` y el campo `Venta.cotizacionId`,
declarado `@unique`.

Convertir una cotización en venta toca dos servicios: hay que crear la venta en
`ventas-caja` y marcar la cotización como vendida en `cotizaciones`. Si alguien
da doble clic, o si la respuesta se pierde y el navegador reintenta, el peligro
es cobrar dos veces y descontar el inventario dos veces.

Dos defensas, no una:

- `pg_advisory_xact_lock(hashtext(id))` serializa las conversiones de *esa*
  cotización. La segunda espera a que termine la primera, encuentra el estado ya
  en `VENDIDA` y devuelve el mismo resultado en vez de fallar.
- `cotizacionId` único en la tabla de ventas es la red de abajo: aunque el
  candado no alcanzara, la base de datos rechaza la segunda venta.

El candado se toma dentro de la transacción y se suelta solo al terminarla, así
que no hay forma de dejarlo puesto por un error a media función.

### El servidor no le cree al cliente

**Dónde:** `VentasService.registrarVenta`.

No es un patrón con nombre propio, pero es la corrección más importante que tuvo
el backend. El POS mandaba el precio en el cuerpo de la petición. Quien supiera
abrir la consola del navegador podía vender un producto de mil pesos en uno.

Hoy la petición de venta lleva **solo `productoId` y `cantidad`**. El precio lo
lee el servicio del catálogo de productos, y el descuento se aplica únicamente si
quien pide la venta tiene `pos:descuento` —lo consulta el mismo proveedor de
privilegios que usa el guard.

---

## 2. Patrones en el frontend

### Proveedor + contexto (Observer) — una sola verdad sobre quién eres

**Dónde:** `apps/frontend/commons/src/permisos/PermisosProvider.tsx`, consumido
con `usePermisos()`.

El proveedor guarda la sesión, descarga los privilegios efectivos del usuario y
los reparte. Cada pantalla pregunta `can("productos:crear")` sin saber de dónde
salió la respuesta.

Tiene un respaldo deliberado: si la API no contesta, cae a la matriz local
(`matriz.ts`) y lo dice en `origenPermisos: "local"`. Es para que la interfaz siga
navegable, no para autorizar nada —el backend valida igual, así que un respaldo
demasiado generoso no abre ninguna puerta.

### Componente-guardia — la versión declarativa del permiso

**Dónde:** `apps/frontend/commons/src/components/Permiso.tsx`.

```tsx
{can("productos:crear") && <Button>Nuevo</Button>}                    {/* imperativo */}
<Permiso requiere="productos:crear"><Button>Nuevo</Button></Permiso>  {/* declarativo */}
```

Conviven porque sirven para cosas distintas: la forma imperativa cuando la
condición se combina con otras (`!puedeDescuento || carrito.length === 0`), la
declarativa cuando es la única condición y se lee mejor.

**Y la regla que las gobierna:** si un botón está detrás de `can("x:y")`, su
endpoint tiene que estar detrás de `@RequierePrivilegio("x:y")`. Sin excepciones.
Esconder un botón no protege nada; solo evita que alguien pulse algo que le van a
rechazar.

### Contenedor y presentación — para poder probar el dinero

**Dónde:** el módulo de POS y caja está partido en tres capas:

| Archivo | Qué es | Qué sabe |
|---|---|---|
| `src/calculos/calculos-pos.ts` | funciones puras | aritmética, nada más |
| `src/hooks/useCarrito.ts` | estado del carrito | React, no la API |
| `src/PosCajaPage.tsx` | orquestador | API, privilegios, avisos |
| `src/components/PanelCaja.tsx` | presentación | solo sus props |

**El problema que resuelve.** Las cuentas de una venta son lo que no puede estar
mal, y probarlas dentro de un componente de React obliga a montar el componente,
simular clics y esperar renders. Con la aritmética en un archivo aparte, las 22
pruebas de `calculos-pos.spec.ts` corren en milisegundos y sin navegador.

`PanelCaja` no guarda estado propio: recibe todo por props. Por eso se le pudo
añadir el privilegio del comprobante agregando una prop, sin tocar su lógica.

### Fachada de API — el reintento que nadie tiene que escribir

**Dónde:** `apps/frontend/commons/src/api/clienteApi.ts`.

`llamarApi()` es el único camino del frontend hacia el backend. Detrás de esa
función pasan cosas que ninguna pantalla debería tener que saber: firmar con el
token, detectar un 401, renovar con el refresh token, reintentar **una** vez, y
avisar a la sesión si ya no hay nada que rescatar.

Si cada pantalla manejara su propio 401, el token vencido produciría siete
comportamientos distintos —y varias renovaciones simultáneas peleándose por
rotar el mismo refresh token, que es justo lo que la rotación interpreta como
robo y castiga cerrando la sesión entera. Por eso hay una sola promesa de refresco
compartida (`refrescoEnCurso`).

### Composición — los ladrillos compartidos

`SearchableTable`, `PageHeader`, `StatCard`, `SkeletonTabla`, `SelectBuscable`,
`EstadoChip` y `PaginaError` viven en `commons` y se combinan en cada módulo.
Ningún microfrontend define su propia tabla ni su propio encabezado.

`SearchableTable` exige `claveFila` (el identificador estable del registro) en
vez de aceptar la posición. Es una decisión con historia: la lista se reordena al
filtrar, y con una clave posicional React reutiliza la fila —y con ella el estado
del renglón— para un registro distinto. En una tabla con acciones eso significa
pulsar *eliminar* sobre el producto equivocado.

---

## 3. Principios SOLID

Uno por uno, con el ejemplo del sistema donde se ve.

### S — Responsabilidad única

El caso más claro es el que se acaba de describir: en el POS, la aritmética, el
estado y la orquestación viven en archivos distintos, y cada uno se puede leer
sin entender los otros dos.

El servicio de reportes es el mismo principio a escala de servicio: agrega, y
nada más. No guarda, no calcula precios, no valida existencias. Por eso es el
único de los siete que no tiene Prisma ni migraciones.

Un contraejemplo que sí se corrigió: `PosCajaPage` llegó a tener dentro la
pestaña completa de caja, sus tablas y sus cuentas. Se sacó `PanelCaja` y los
cálculos a sus propios archivos cuando el archivo pasó de mil líneas y nadie
quería tocarlo.

### O — Abierto a extensión, cerrado a modificación

Los tres privilegios que se agregaron al sistema en el último cambio
—`ventas:comprobante`, `reportes:utilidad`, `reportes:exportar`— **no obligaron a
tocar ni una línea del guard, del extractor de identidad ni del proveedor de
privilegios**. Fueron tres renglones en el catálogo de la semilla, un decorador
por endpoint y un `can()` por pantalla.

Lo mismo con los microfrontends: agregar un módulo nuevo es crear su paquete y
añadir un renglón a `web-shell/src/config/navegacion.ts`. El armazón no cambia.

### L — Sustitución de Liskov

Las dos implementaciones de `ProveedorPrivilegios` son intercambiables de verdad,
no de nombre: devuelven el mismo `ResultadoVerificacion` con los mismos motivos
de rechazo (`USUARIO_NO_ENCONTRADO`, `USUARIO_INACTIVO`, `SIN_PRIVILEGIO`), y el
guard traduce cada motivo al mismo estatus HTTP sin preguntar cuál tiene enfrente.

Cambiar una por otra —que es exactamente lo que hace el servicio de seguridad
frente a los otros seis— no altera el comportamiento observable desde afuera. Esa
es la prueba del principio: si el guard tuviera que preguntar "¿eres el local o
el HTTP?" para decidir algo, estaría roto.

### I — Segregación de interfaces

El ejemplo está en los dos endpoints que devuelven archivos. El comprobante PDF y
la exportación CSV necesitan escribir cabeceras y mandar un cuerpo binario, así
que reciben el objeto de respuesta. Pero en vez de depender del `Response`
completo de Express —decenas de métodos— declaran lo mínimo:

```ts
interface RespuestaBinaria {
  setHeader: (nombre: string, valor: string) => void;
  send: (cuerpo: Buffer) => void;
}
```

Dos métodos, que son los dos que se usan. El controlador queda atado a lo que
necesita y no al framework HTTP entero, y una prueba puede pasarle un objeto
falso de dos funciones en vez de fabricar un `Response` de verdad.

### D — Inversión de dependencias

`GuardPrivilegios` —la pieza más crítica del sistema, la que decide quién puede
hacer qué— **no importa ninguna clase concreta**. Recibe tres abstracciones por
el constructor, identificadas con tokens de inyección:

```ts
constructor(
  private readonly reflector: Reflector,
  @Inject(EXTRACTOR_IDENTIDAD) private readonly extractor: ExtractorIdentidad,
  @Inject(PROVEEDOR_PRIVILEGIOS) private readonly proveedor: ProveedorPrivilegios,
  @Inject(VERIFICADOR_DENYLIST) private readonly denylist: VerificadorDenylist,
)
```

La política de alto nivel ("sin identidad, 401; sin privilegio, 403") no depende
del detalle de bajo nivel ("los privilegios se consultan por HTTP"). Los dos
dependen de la interfaz.

Se nota en las pruebas: `privilegios.service.spec.ts` verifica la regla que más
pesa en la calificación —los privilegios efectivos son los del rol más los
concedidos menos los revocados, y una revocación individual le gana incluso a un
rol con acceso total— **sin base de datos y sin Redis**, pasando objetos planos
donde el servicio espera sus dependencias. Eso solo se puede hacer si las
dependencias están invertidas.

---

## 4. Lo que se decidió no aplicar

Tan importante como lo que se usó. La rúbrica advierte que más arquitectura no es
mejor arquitectura, y estos son los patrones que se consideraron y se dejaron
fuera con razón:

| Patrón | Por qué no |
|---|---|
| **Saga / compensación** | La única operación que cruza servicios y escribe en dos lados es convertir una cotización. Se resolvió con candado más llave de idempotencia, que cabe en veinte líneas. Una saga con sus compensaciones sería más código y más formas de fallar para el mismo resultado |
| **Event sourcing / Kafka** | No hay ningún consumidor que necesite el historial de eventos. Los reportes se calculan del estado actual y tardan menos de un segundo. Kafka aquí sería un servicio más que mantener, sin nadie que lo escuche |
| **CQRS** | Las lecturas y las escrituras del sistema son del mismo orden de magnitud y ninguna consulta es lenta. Separar los modelos duplicaría el trabajo sin resolver ningún problema medido |
| **Circuit breaker completo** | Se quedó en tiempo de espera más degradación elegante: el historial del cliente responde con `parcial: true` y `fuentesFallidas` cuando un servicio no contesta, en vez de fallar entero. Con seis servicios en una máquina, un disyuntor con sus estados y su ventana no cambiaría lo que ve el usuario |
| **Repositorio propio sobre Prisma** | Prisma ya es la capa de acceso a datos. Envolverla en repositorios escritos a mano solo agregaría una capa que traduce de un modelo tipado a otro modelo tipado |

---

## 5. Dónde verificar cada cosa

| Afirmación | Cómo comprobarla |
|---|---|
| El backend valida privilegios de verdad | `curl -i http://<host>/api/seguridad/usuarios` sin token → 401 |
| Los patrones de seguridad están donde se dice | `apps/backend/commons/src/seguridad/` |
| Las cuentas del POS están probadas | `pnpm --filter @scipos/pos-caja-front test` |
| La regla de privilegios efectivos está probada | `pnpm --filter @scipos/seguridad-service test` |
| Todo el repositorio compila y pasa | `pnpm lint && pnpm typecheck && pnpm test && pnpm build` |
