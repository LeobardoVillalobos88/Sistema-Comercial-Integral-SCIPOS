# Diseño de conversación — asistente de almacén

Recorrido de las cuatro acciones de la skill por las cuatro capas: usuario,
intención, control y resultado. El diagrama para presentar está en
[`diseno-conversacion-alexa.html`](./diseno-conversacion-alexa.html); este
documento es la versión consultable.

Nombre de invocación: **`asistente almacen`**. Se dice *"Alexa, abre asistente
almacén"*. No lleva la preposición «de» porque Amazon no la admite en los
nombres de invocación.

Notación de la capa de intención, en el orden en que se configuran:

| Marca | Significado |
|---|---|
| **F** | Slot Filling: Alexa pregunta hasta obtener el dato |
| **V** | Validación: rechaza valores fuera de rango y vuelve a preguntar |
| **C** | Confirmación: repite el dato y pide que se confirme |

---

## 1. Registrar producto

Da de alta un producto en el catálogo. Queda con cero existencias a propósito:
surtirlo es la siguiente acción.

**Capa de usuario** — tres ejemplos de los dieciséis del modelo:

- "registra un producto nuevo"
- "da de alta un producto"
- "agrega un producto al catalogo"

**Capa de intención** — `RegistrarProductoIntent`, con confirmación de intent.

| Slot | Tipo | F | V | C |
|---|---|:-:|:-:|:-:|
| `nombreProducto` | `SciposProducto` | F | — | C |
| `precioCompra` | `AMAZON.NUMBER` | F | V | — |
| `precioVenta` | `AMAZON.NUMBER` | F | V | C |
| `fechaCaducidad` | `AMAZON.DATE` | F | — | C |

Validaciones: los dos precios deben ser mayores a cero y no pasar de cien mil.

**Capa de control** — **API → API → DynamoDB**, en ese orden.

Primero consulta el catálogo para ver si el producto ya existe. Va a la API y no
a Dynamo porque el duplicado se decide contra Postgres, que es la fuente de
verdad: el producto pudo haberse capturado desde la interfaz web y la bitácora
de voz no lo sabría. Si no existe, lo crea. Después escribe en Dynamo el folio
del lote y la operación en la bitácora.

**Capa de resultado**

- "Registré yogurt griego con lote VOZ-003 y precio de venta de 32 pesos. Quedó sin existencias."
- Si ya existe: "Yogurt griego ya está en el catálogo con 40 piezas. Si quieres agregarle más, di: surte inventario."
- Si el precio de venta no supera al de compra: vuelve a preguntar solo ese precio.
- Si la fecha ya pasó: vuelve a preguntar solo la fecha.

---

## 2. Surtir inventario

Registra la mercancía que llega de un proveedor e incrementa las existencias.

**Capa de usuario**

- "surte inventario"
- "llego mercancia"
- "surte cincuenta de leche"

**Capa de intención** — `SurtirInventarioIntent`, con confirmación de intent.

| Slot | Tipo | F | V | C |
|---|---|:-:|:-:|:-:|
| `producto` | `SciposProducto` | F | — | C |
| `cantidad` | `AMAZON.NUMBER` | F | V | — |
| `proveedor` | `SciposProveedor` | F | — | — |

Validación: la cantidad va de una a cinco mil piezas.

**Capa de control** — **DynamoDB → API → DynamoDB**, en ese orden.

Dynamo va primero, y aquí el orden es la decisión de diseño más importante de la
skill. Si el reconocimiento falla y la persona repite la misma frase, surtir dos
veces deja piezas que no existen en el anaquel, y el error no se nota hasta el
siguiente conteo físico. Antes de llamar a la API se busca en la bitácora una
operación con la misma huella —producto y cantidad— dentro de los últimos dos
minutos. Si aparece, se responde con el resultado guardado y no se escribe nada.

Si no es repetida, consulta el catálogo para resolver el nombre dictado, registra
la compra —el precio no viaja en la petición: lo pone el servicio desde el precio
de compra vigente— y vuelve a Dynamo a anotar la operación.

**Capa de resultado**

- "Entraron 50 piezas de Leche entera 1L. Ahora tienes 130."
- Si es repetida: "Esa entrada ya la registré hace un momento. Leche entera 1L quedó con 130 piezas."
- Si el producto no existe: "No encontré yogurt griego en el catálogo. Si es nuevo, di: registra un producto nuevo."

---

## 3. Revisar inventario

Lee las alertas de caducidad y de existencias que calcula el backend.

**Capa de usuario**

- "revisa las alertas del inventario"
- "que productos estan por caducar"
- "como anda el inventario"

**Capa de intención** — `RevisarInventarioIntent`, **sin** confirmación de
intent: es una lectura, y confirmarla sería estorbo.

| Slot | Tipo | F | V | C |
|---|---|:-:|:-:|:-:|
| `tipoRevision` | `SciposTipoRevision` | F | — | — |

**Capa de control** — **solo API**. No hay nada que persistir.

Los umbrales que deciden qué está por caducar y qué es existencia baja viven en
el servicio, no en la skill, así que la voz y la interfaz web no pueden
contradecirse.

**Capa de resultado**

- "Tienes 2 lotes vencidos y 2 por vencer. El más urgente es Leche entera 1L, que venció hace 25 días."
- Con el inventario sano: "El inventario está sin alertas: nada vencido y nada por agotarse."

---

## 4. Bitácora de voz

Resume lo que se dictó hoy.

**Capa de usuario**

- "que registre hoy por voz"
- "dame mi bitacora"
- "cuantas operaciones llevo hoy"

**Capa de intención** — `BitacoraVozIntent`. Sin slots y sin confirmación: la
pregunta no necesita datos.

**Capa de control** — **solo DynamoDB**. La bitácora de voz solo existe ahí; la
API no la conoce, porque es un registro de cómo se capturó y no de qué se
capturó.

**Capa de resultado**

- "Hoy por voz registraste 1 producto nuevo y 2 entradas de inventario por 1,325 pesos. Lo último fue Papel higiénico 4 rollos."
- Sin actividad: "Hoy todavía no has registrado nada por voz."

---

## Por qué los cuatro recorridos son distintos

| Acción | Recorrido | Razón |
|---|---|---|
| Registrar producto | API → API → Dynamo | El duplicado se decide contra la fuente de verdad |
| Surtir inventario | Dynamo → API → Dynamo | La repetición hay que cortarla antes de escribir |
| Revisar inventario | solo API | Lectura pura, nada que persistir |
| Bitácora de voz | solo Dynamo | Ese dato no existe en el sistema web |

DynamoDB no duplica la base del sistema. Guarda tres cosas que solo tienen
sentido del lado de la voz: la **bitácora** de lo dictado, la **huella de
idempotencia** que evita el doble dictado, y el **folio** con el que se generan
las claves de lote `VOZ-XXX`. Además cachea el token de sesión para no iniciar
sesión en cada frase.

## Manejo de errores

Ninguna respuesta de error cierra la sesión: todas terminan ofreciendo el
siguiente paso.

| Origen | Situación | Respuesta |
|---|---|---|
| Diálogo | Valor fuera de rango | La validación del slot vuelve a preguntar |
| Diálogo | Se niega la confirmación | Cancela y explica cómo reintentar |
| Lambda | Precio de venta bajo el de compra | Repregunta solo el precio de venta |
| Lambda | Fecha de caducidad ya pasada | Repregunta solo la fecha |
| Lambda | Operación repetida | Devuelve el mismo resultado sin duplicar |
| API | 401 o 403 | "No tengo permiso para hacer eso en el sistema" |
| API | 404 | "No encontré ese registro en el sistema" |
| API | 5xx, tiempo agotado o red caída | "El sistema no responde en este momento, tu operación no se registró" |
| API | 400 | Se lee el mensaje en español que devuelve el backend |
