# Arquitectura del backend (microservicios)

Responde las seis preguntas guía del enunciado, con el archivo donde se comprueba
cada respuesta.

---

## ¿Qué microservicios existen?

Ocho procesos: un gateway, seis servicios de dominio y una biblioteca común que
no corre sola.

| Proceso | Puerto | Esquema en PostgreSQL |
|---|---|---|
| `@scipos/gateway` | 4000 | — |
| `@scipos/seguridad-service` | 4001 | `seguridad` |
| `@scipos/productos-service` | 4002 | `productos` |
| `@scipos/clientes-service` | 4003 | `clientes` |
| `@scipos/cotizaciones-service` | 4004 | `cotizaciones` |
| `@scipos/ventas-caja-service` | 4005 | `ventas_caja` |
| `@scipos/reportes-service` | 4006 | **ninguno** |
| `@scipos/backend-commons` | — | biblioteca compartida |

En el despliegue los siete procesos arrancan de la misma imagen de Docker y se
diferencian por su `working_dir`. Cada uno sigue siendo su propio contenedor, con
su puerto, su esquema y su health check; lo único compartido es el artefacto.
La razón está en [decisiones técnicas](./decisiones-tecnicas.md#2-una-sola-imagen-de-docker-para-los-siete-procesos-del-backend).

## ¿Qué hace cada servicio?

**Gateway (4000).** Única entrada HTTP. Enruta `/api/<servicio>/*` al puerto que
toca según la tabla de `src/config/servicios.ts`, verifica el token en el borde
antes de dejar pasar, y **quita de toda petición externa la cabecera
`x-usuario-id`**. Ese detalle no es menor: esa cabecera es el canal de identidad
entre servicios, y si se pudiera mandar desde afuera cualquiera se haría pasar
por el administrador escribiendo su identificador. Desde fuera, la identidad solo
puede llegar como token Bearer.

**Seguridad (4001).** La fuente de verdad de quién es quién y qué puede hacer.
Inicio de sesión con bcrypt, firma de tokens RS256, publicación del JWKS,
renovación y cierre de sesión, administración de usuarios y el motor de
privilegios: catálogo, matriz por rol y ajustes por usuario. Es el único que
tiene la llave privada.

**Productos (4002).** Catálogo con lote y caducidad, doble precio (compra y
venta), baja lógica y borrado definitivo. Además: compras a proveedor —que
incrementan existencias—, el endpoint interno de movimiento de stock que consume
ventas, y las alertas de caducidad y existencias.

**Clientes (4003).** Datos de clientes con validación de teléfono y RFC, y el
historial por cliente, que agrega cotizaciones y ventas de otros dos servicios.

**Cotizaciones (4004).** Cotizaciones con folio secuencial transaccional
(`COT-000001`), el ciclo borrador → enviada → vendida, totales calculados con
`decimal.js`, y la conversión a venta.

**Ventas y caja (4005).** Punto de venta y turnos de caja. Registra ventas
—reprecinado siempre desde el catálogo—, cancela reponiendo existencias, abre y
cierra turnos con su corte, y genera el comprobante PDF no fiscal con pdfkit.

**Reportes (4006).** Cinco reportes y la utilidad. **No tiene base de datos**:
agrega por REST desde los demás. Es una fachada, y por eso no puede desincronizar
nada.

### Por qué esta división y no otra

El criterio fue *quién es dueño del dato*, no *cuántos servicios se ven bien*.

Dos decisiones que suelen preguntarse:

- **Compras vive en productos, no en un servicio propio.** Una compra existe para
  mover existencias, y las existencias son de productos. Separarlos obligaría a
  coordinar dos bases en cada compra —una transacción distribuida para algo que
  hoy es una transacción de PostgreSQL.
- **POS y caja son un solo servicio.** Una venta no se puede registrar sin turno
  abierto, y el corte suma las ventas del turno. Son la misma consistencia; en
  servicios distintos habría que sincronizarla a mano.

## ¿REST, eventos o ambos?

**REST solamente**, con `ClienteHttp` de `backend-commons`.

Se evaluó Kafka y se dejó fuera: no hay ningún consumidor que necesite el
historial de eventos. Los reportes se calculan del estado actual y responden en
menos de un segundo. Kafka aquí sería un servicio más que mantener sin nadie que
lo escuche. La decisión está argumentada en el apartado 4 de
[patrones y SOLID](./patrones-y-solid.md).

Quién llama a quién:

```
cotizaciones ──▶ clientes      (validar que el cliente existe y está activo)
cotizaciones ──▶ productos     (validar cada producto)
cotizaciones ──▶ ventas-caja   (convertir la cotización en venta)
ventas-caja  ──▶ productos     (precio real y movimiento de existencias)
clientes     ──▶ cotizaciones  (historial del cliente)
clientes     ──▶ ventas-caja   (historial del cliente)
reportes     ──▶ los cuatro anteriores
los seis     ──▶ seguridad     (verificar privilegios)
```

**No hay ciclos de escritura.** `clientes` llama a `cotizaciones` solo para leer,
y `cotizaciones` llama a `clientes` solo para validar. Ninguno espera a que el
otro escriba.

La identidad viaja en la cabecera `x-usuario-id`, que `ClienteHttp` propaga
automáticamente. Por eso un reporte que un vendedor no puede ver falla aunque lo
pida el servicio de reportes: la petición interna lleva la identidad de quien
preguntó, no la del servicio.

## ¿Qué esquemas usa cada servicio?

Un esquema por servicio dentro de una sola base `scipos`, con **una regla
inviolable: ningún servicio lee el esquema de otro**. Lo cruzado va por REST.

Tablas principales:

| Servicio | Tablas |
|---|---|
| seguridad | `Rol`, `Privilegio`, `RolPrivilegio`, `Usuario`, `UsuarioPrivilegio`, `RefreshToken` |
| productos | `Producto`, `Compra`, `CompraPartida` |
| clientes | `Cliente` |
| cotizaciones | `Cotizacion`, `CotizacionPartida`, `SecuenciaFolio` |
| ventas-caja | `Caja`, `MovimientoCaja`, `Venta`, `VentaPartida` |

Dos modelos que cargan una decisión de diseño:

- **`UsuarioPrivilegio` tiene un campo `concedido`.** Con `true` otorga un
  privilegio que el rol no da; con `false` **revoca uno que el rol sí da**. Esa
  segunda mitad es la que convierte el sistema en multiprivilegio de verdad: sin
  ella, un usuario no podría tener menos que su rol y los privilegios serían
  roles con otro nombre.
- **`Venta.cotizacionId` es único.** Es lo que hace idempotente convertir una
  cotización: la segunda vez no crea una venta nueva, la base lo impide.

Una trampa del entorno que conviene dejar escrita: **el adaptador `@prisma/adapter-pg`
no lee el `?schema=` de la URL**. Cada `prisma.service.ts` y cada semilla lo
extraen y se lo pasan explícitamente a `PrismaPg`. Sin eso, los seis servicios
escribirían felizmente en `public`, encima unos de otros.

## ¿Cómo se protegen los endpoints?

Cuatro capas, de afuera hacia adentro.

**1. La red.** En el servidor solo nginx publica un puerto. Los puertos
4000-4006, PostgreSQL y Redis viven en la red interna de Docker y no se alcanzan
desde internet.

**2. El gateway.** Verifica el token en el borde —firma RS256 contra el JWKS,
emisor, audiencia y lista de revocados— antes de proxyar, y quita la cabecera
`x-usuario-id` de lo que venga de afuera.

**3. El guard global de cada servicio.** Se registra con
`ModuloSeguridad.registrar()` y protege todos los controladores. Vuelve a
verificar lo que ya verificó el gateway: es defensa en profundidad, y si alguien
alcanzara un servicio saltándose el proxy no encontraría la puerta abierta.

**4. El decorador de cada endpoint.**

```ts
@Post()
@RequierePrivilegio("pos:vender")   // exige un privilegio concreto → 401 / 403
@Get("estado")
@RequiereIdentidad()                // basta con estar identificado → 401
```

Un endpoint sin decorador es público. Solo lo son `/health` y el JWKS.

El guard pregunta en orden: identidad → lista de revocados → privilegio. La
segunda pregunta existe porque un token firmado sigue siendo válido hasta que
expira: sin ella, cerrar sesión sería una sugerencia durante quince minutos.

**La regla que ata frontend y backend:** si un botón está detrás de `can("x:y")`,
su endpoint está detrás de `@RequierePrivilegio("x:y")`. Los privilegios efectivos
se resuelven en seguridad como *los del rol, más los concedidos, menos los
revocados*, con caché de 60 segundos en Redis que se invalida en cuanto cambia
una asignación.

## ¿Cómo manejan los fallos entre servicios?

Cinco mecanismos, cada uno para un fallo distinto.

**Tiempo de espera.** `ClienteHttp` corta a los 5 segundos y lo convierte en un
503 con mensaje en español. Sin él, un servicio caído no daría error: dejaría la
petición colgada y el usuario vería una pantalla girando para siempre.

**Se conserva el estatus original.** Si productos responde 404 porque un producto
no existe, cotizaciones devuelve 404, no 500. El error del usuario no se disfraza
de error del servidor.

**Degradación parcial.** El historial de un cliente pide cotizaciones y ventas a
dos servicios. Si uno no contesta, no falla todo: devuelve lo que sí consiguió y
lo declara.

```jsonc
{ "clienteId": "c-001", "cotizaciones": [...], "ventas": [],
  "parcial": true, "fuentesFallidas": ["ventas"] }
```

La pantalla muestra lo que hay y avisa que falta una parte. Es mejor que una
pantalla vacía y muchísimo mejor que una lista incompleta que se ve completa.

**El gateway responde por el servicio caído.** Si un servicio no está arriba, el
proxy no devuelve una página de error de nginx: devuelve JSON con la misma forma
que el resto del sistema.

```jsonc
{ "estatus": 502, "mensaje": "El servicio \"productos\" no está disponible.",
  "error": "Servicio no disponible" }
```

Así el frontend no necesita un caso especial para "el error no venía en JSON".

**Una sola forma de error.** `FiltroExcepcionesHttp` normaliza todo a
`{ estatus, mensaje, error, ruta, fecha }`, con el mensaje en español listo para
mostrarse. El frontend lee siempre el mismo campo.

**Redis se degrada, no bloquea.** Si Redis no responde, la caché de privilegios
se consulta contra la base y el sistema sigue. Se pierde velocidad y la
revocación inmediata de tokens; no se pierde el acceso.

**Lo que no hay, dicho claro.** No hay reintentos automáticos entre servicios ni
un disyuntor con sus estados. Con reintentos habría que garantizar antes que cada
operación es idempotente —y descontar existencias no lo es. Es preferible fallar
una vez con un mensaje claro que descontar dos veces del inventario.

## Documentación de la API

Cada servicio publica su documentación en `/docs` (Scalar sobre Swagger) y el
JSON en `/api-json`. Los seis contratos versionados están en
`docs/02-api/openapi/services/`.

El contrato se escribe **antes** que el endpoint. Y desde el último cambio, el
trabajo `contratos` de la integración continua valida los seis YAML en cada
empujón: la primera vez que corrió encontró que `seguridad.yaml` llevaba tiempo
mal formado por un `Authorization: Bearer` sin comillas —un YAML roto no avisa
hasta que alguien abre `/docs`.
