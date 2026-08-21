# Cumplimiento de la rúbrica — skill de Alexa

Repaso punto por punto de los requerimientos y de la rúbrica de evaluación, con
dónde se cumple cada uno y cómo comprobarlo. Incluye los criterios de
presentación, con el guion de demostración y las respuestas preparadas.

Las cifras de este documento no están escritas a mano: las mide
`apps/alexa-skill/verificacion/modelo-interaccion.spec.js`, que corre con
`pnpm --filter @scipos/alexa-skill test` y falla si alguna deja de cumplirse.

---

## Requerimientos funcionales

### I. Al menos 3 acciones funcionales bien enfocadas

**Se cumple con cuatro.**

| Acción | Qué hace en el sistema |
|---|---|
| Registrar producto | Da de alta un producto en el catálogo de Postgres, con lote generado |
| Surtir inventario | Registra una compra a proveedor e incrementa existencias |
| Revisar inventario | Lee las alertas de caducidad y existencias que calcula el backend |
| Bitácora de voz | Resume y agrega lo dictado durante el día |

Las tres primeras escriben o leen datos reales del sistema web. La primera es,
textualmente, el ejemplo que da el documento de requerimientos.

### II. Nada de acciones sin profundidad

**Se cumple.** Ninguna es una consulta de estatus. Tres de las cuatro tocan la
base de datos del sistema, y la cuarta —la bitácora— no devuelve un dato suelto:
agrega por tipo, suma el importe invertido y nombra la última operación.

### III. Se vale una acción fuera del proyecto web

**Aprovechado.** La bitácora de voz no existe en la interfaz web: es un registro
de lo que se capturó hablando, y vive solo en DynamoDB. Además, la skill es el
único punto del sistema que llenaba el campo `proveedor` de una compra hasta que
se agregó a la pantalla.

---

## Requerimientos no funcionales

### I. Entre 10 y 15 utterances por intent, o más

**Se cumple con el doble.** La buena práctica que menciona el documento son 20 a
50; se eligió el rango alto para que la NLU tenga de dónde agarrarse cuando
alguien improvise una frase.

| Intent | Utterances |
|---|---|
| `RegistrarProductoIntent` | 36 |
| `SurtirInventarioIntent` | 36 |
| `RevisarInventarioIntent` | 36 |
| `BitacoraVozIntent` | 32 |

La prueba exige un mínimo de 30, que ninguna frase se repita dentro de un intent,
y que ninguna se repita entre intents distintos —lo que confundiría a la NLU.

### II. Slots con llenado: 4 speeches y 8 utterances de usuario

**Se cumple en los ocho slots.** Cuatro variaciones de pregunta y ocho formas de
responder cada uno.

| Slot | Speeches | Utterances |
|---|---|---|
| `nombreProducto` | 4 | 8 |
| `precioCompra` | 4 | 8 |
| `precioVenta` | 4 | 8 |
| `fechaCaducidad` | 4 | 8 |
| `producto` | 4 | 8 |
| `cantidad` | 4 | 8 |
| `proveedor` | 4 | 8 |
| `tipoRevision` | 4 | 8 |

### III. Confirmaciones con 2 speeches

**Se cumple en las seis configuradas:** dos de intent y cuatro de slot.

| Confirmación | Speeches |
|---|---|
| Intent `RegistrarProductoIntent` | 2 |
| Intent `SurtirInventarioIntent` | 2 |
| Slot `nombreProducto` | 2 |
| Slot `precioVenta` | 2 |
| Slot `fechaCaducidad` | 2 |
| Slot `producto` | 2 |

`RevisarInventarioIntent` y `BitacoraVozIntent` no llevan confirmación a
propósito: son lecturas, y confirmarlas sería estorbo. El requerimiento aplica
"solo si se configuran".

### IV. Validaciones con 2 speeches cada una

**Se cumple en las seis.** Y ninguna dice solo que hubo un error: todas dicen qué
se esperaba.

| Validación | Speeches |
|---|---|
| `precioCompra` mayor a cero | 2 |
| `precioCompra` hasta cien mil | 2 |
| `precioVenta` mayor a cero | 2 |
| `precioVenta` hasta cien mil | 2 |
| `cantidad` al menos una pieza | 2 |
| `cantidad` hasta cinco mil | 2 |

### V. Diseño de conversación

**Entregado** en el formato del documento, con las cuatro capas, tres utterances
de ejemplo por intent, los chips F/V/C en orden y el recorrido Dynamo/API por
handler: [`diseno-conversacion-alexa.md`](./diseno-conversacion-alexa.md) y su
diagrama [`diseno-conversacion-alexa.html`](./diseno-conversacion-alexa.html).

Un script verifica que el diagrama corresponda al modelo real: que cada chip
dibujado exista en el JSON y que las utterances citadas sigan estando.

---

## Rúbrica — criterios funcionales

### 1. Alexa reconoce el nombre de invocación

**Se cumple.** El nombre es `asistente almacen`: dos palabras reales del español,
en minúsculas, sin tilde y sin preposiciones. Amazon rechaza artículos y
preposiciones en el nombre de invocación, así que el natural `asistente de
almacén` no pasa la validación de la consola.

### 2. Ejecuta las acciones sin trabarse ni perder la sesión

**Se cumple, y fue lo que más trabajo costó.** Dos causas de pérdida de sesión
se encontraron probando y ya están corregidas:

- El runtime de Alexa es anterior a Node 18 y no tiene `fetch` ni
  `AbortSignal.timeout`. Toda llamada a la API fallaba. La skill usa ahora los
  módulos `http` y `https` nativos.
- Un producto o proveedor fuera de la lista de valores no llenaba el slot y a la
  tercera repregunta Alexa colgaba. Ver el criterio 3.

Además, **ninguna respuesta de error cierra la sesión**: todas terminan con un
`reprompt` que ofrece el siguiente paso. Una prueba lo verifica contando las
salidas del código: solo la despedida y las re-preguntas de slot pueden salir sin
reprompt.

### 3. Los slots funcionan sin tumbar la sesión

**Se cumple.** Los tres slots que reciben nombres —producto al registrar,
producto al surtir y proveedor— son de tipo **`AMAZON.SearchQuery`**, texto
libre. Aceptan cualquier cosa que se diga.

Antes eran tipos con lista de valores, y ahí estaba el problema: los productos y
las marcas no se pueden enumerar. "Chicharrones", "pasta dental" y "Divella"
tumbaban la sesión porque no se parecían a ningún valor de la lista. Quien
resuelve el nombre contra el catálogo real es el Lambda, no el modelo, así que la
lista nunca fue lo que hacía el trabajo.

Los demás slots usan tipos integrados de Amazon —`AMAZON.NUMBER` y
`AMAZON.DATE`—, que cubren su dominio completo. `SciposTipoRevision` es el único
con lista, porque sus tres opciones sí son cerradas; cada una lleva doce
sinónimos para que nadie se atore buscando la palabra exacta.

### 4. Las validaciones no permiten datos erróneos

**Se cumple en dos niveles.** Seis validaciones en el modelo, que Alexa aplica
antes de llamar al código:

| Dato | Rango admitido |
|---|---|
| Precio de compra | mayor a cero, hasta cien mil |
| Precio de venta | mayor a cero, hasta cien mil |
| Cantidad a surtir | de una a cinco mil piezas |

Y dos reglas de negocio en el Lambda, que un rango no puede expresar:

- El precio de venta debe superar al de compra. Si no, repregunta **solo** ese
  precio con `addElicitSlotDirective`, sin reiniciar el diálogo.
- La fecha de caducidad no puede estar en el pasado. Mismo tratamiento.

### 5. Diferencia los intents unos de otros

**Se cumple por diseño del vocabulario.** Registrar y surtir son los dos que
podrían confundirse, así que usan familias de verbos deliberadamente disjuntas:

| Intent | Verbos | Nunca usa |
|---|---|---|
| Registrar | registra, da de alta, agrega al catálogo, captura, crea | surte, llegó, abastece |
| Surtir | surte, resurte, llegó, entró, abastece, carga | registra, da de alta, captura |

La prueba verifica que ninguna utterance se repita entre intents, que es la forma
más directa de volverlos ambiguos.

### 6. Mecánicas de manejo de errores que no interrumpen el flujo

**Se cumple en tres capas.**

| Capa | Qué atrapa |
|---|---|
| Modelo | Valores fuera de rango, y la negativa a confirmar |
| Lambda | Margen negativo, fecha pasada, producto inexistente, operación repetida |
| API | Cada código HTTP traducido a una frase útil, nunca un error crudo |

Los códigos se traducen así: 401 y 403 dicen que no hay permiso; 404, que no se
encontró el registro; 400 lee el mensaje en español que ya devuelve el backend; y
5xx, tiempo agotado o red caída dicen que el sistema no responde **y que la
operación no se registró**, que es lo que la persona necesita saber.

Todo fallo de red se escribe además en CloudWatch antes de convertirse en frase.
Sin eso, un corte de red y una función ausente en el runtime producen la misma
frase y no hay forma de distinguirlas.

### 7. Cancelar, salir y detener funcionan

**Se cumple.** `AMAZON.CancelIntent` y `AMAZON.StopIntent` cierran con "Hasta
luego". `AMAZON.HelpIntent` explica las cuatro acciones. `AMAZON.FallbackIntent`
atiende lo que no se entendió y repite el menú. `AMAZON.NavigateHomeIntent`
vuelve al menú sin cerrar la sesión.

Los cinco están **declarados en el modelo y atendidos por un handler propio**.
Una prueba lo verifica: un intent declarado sin handler cae en el reflector y
Alexa contestaría con su nombre técnico, que es de las primeras cosas que alguien
prueba.

Negar la confirmación final también está atendido: la skill dice que canceló y
explica cómo reintentar, en vez de quedarse muda.

### 8. Buen uso de persistencia de datos (DynamoDB)

**Se cumple con tres usos reales**, ninguno decorativo. DynamoDB no duplica
Postgres: guarda lo que solo tiene sentido del lado de la voz.

| Uso | Para qué |
|---|---|
| Bitácora | Cada operación dictada queda registrada; el cuarto intent la lee y la agrega |
| Huella de idempotencia | Corta el doble dictado antes de que llegue a la API |
| Contador de folio | Genera las claves de lote `VOZ-001`, `VOZ-002`… |

Más un cuarto uso de infraestructura: cachea el token de sesión para no iniciar
sesión en cada frase.

El patrón es el mismo del ejemplo de clase —un item, `get`, modificar el arreglo,
`update` con `UpdateExpression`— con una diferencia deliberada: el arranque
**lee antes de crear**. Un `put` incondicional en cada lanzamiento borraría la
bitácora.

### 9. Se comunica de manera efectiva con la API del proyecto

**Se cumple con cinco llamadas** a la API real del proyecto, la misma que consume
la interfaz web:

| Método | Ruta | Para qué |
|---|---|---|
| POST | `/seguridad/auth/login` | Obtener el token |
| GET | `/productos/productos` | Consultar el catálogo |
| POST | `/productos/productos` | Dar de alta |
| POST | `/productos/compras` | Registrar la entrada |
| GET | `/productos/productos/alertas` | Leer las alertas |

Cada llamada viaja con el token del usuario `asistente@scipos.com` y **pasa por
el mismo guard de privilegios que protege la web**. Ese usuario tiene rol
Vendedor y exactamente tres privilegios efectivos: se le conceden
`productos:crear` y `compras:ver`, y se le revocan los nueve que su rol trae pero
la skill no usa.

Eso permite una demostración difícil de discutir: revocarle `productos:crear`
desde `/usuarios` en la web hace que Alexa conteste "no tengo permiso" en la
siguiente frase, **sin tocar una línea del código de la skill**.

### 10. Produce el mismo resultado al ejecutarse varias veces

**Se cumple, con dos estrategias distintas según lo que se repita.**

Al **surtir**, se consulta DynamoDB *antes* que la API: si la misma huella
—producto y cantidad— aparece en los últimos dos minutos, responde con el
resultado guardado y no vuelve a escribir. Duplicar una entrada dejaría piezas
que no existen en el anaquel, y ese error no se nota hasta el conteo físico.

Al **registrar**, se consulta el catálogo de Postgres, que es la fuente de
verdad: el producto pudo haberse capturado desde la web, donde la bitácora de voz
no lo vería.

Las dos lecturas —alertas y bitácora— son idempotentes por naturaleza.

---

## Rúbrica — criterios no funcionales

| Criterio | Estado |
|---|---|
| 1. Entre 10-15 utterances o más | 32 a 36 por intent |
| 2. Slots con 4 speeches y 8 utterances | Los ocho slots |
| 3. Validaciones con 2 speeches | Las seis |
| 4. Confirmaciones con 2 speeches | Las seis |
| 5. Flujo de conversación correcto | Todo el copy en español, incluidos ayuda, cancelar y lo no entendido |
| 6. Indica qué hacer al iniciar, durante y al terminar | Menú al abrir, reprompt en cada respuesta, y el siguiente paso sugerido tras cada acción |

Sobre el criterio 5: el ejemplo de clase deja los handlers estándar en inglés.
Aquí están todos en español, porque una skill que atiende en español y de pronto
dice "Sorry, I don't know about that" rompe el flujo.

Sobre el criterio 6: tras registrar un producto, la skill no se queda callada —
dice que quedó sin existencias y **cómo surtirlo**. Encadenar la sugerencia con
la siguiente acción es lo que convierte cuatro intents sueltos en un flujo.

---

## Rúbrica — presentación

Estos cuatro criterios los califica lo que se dice y se muestra, no el código.
Lo que sigue es el material para llegar preparado.

### 1. Presentar la skill en Amazon Developer

Se muestra en la consola, en la pestaña **Test** con el idioma en *Español (MX)*.
Conviene tener abiertas de antemano tres pestañas: la consola de Alexa, la
interfaz web del sistema en `/productos`, y `/usuarios` para la demostración
final de privilegios.

**Guion de demostración.** Las cuatro acciones encadenadas, de modo que cada una
prepare a la siguiente:

1. *"Alexa, abre asistente almacén"* → da la bienvenida y enumera las acciones.
2. *"Registra un producto nuevo"* → completar el diálogo con un producto que
   **no esté en el catálogo**, dictando una fecha de caducidad cercana. Al
   terminar, mostrar en `/productos` de la web que ya está ahí con su lote
   `VOZ-XXX`. Ese salto de la voz a la pantalla es el momento que prueba el
   criterio de comunicación con la API.
3. *"Surte inventario"* → surtir ese mismo producto. Mostrar que la existencia
   subió en la web.
4. **Repetir la frase idéntica** → responde que ya la registró y no vuelve a
   sumar. Es la prueba de idempotencia, y se ve mejor haciéndola que contándola.
5. *"Revisa las alertas del inventario"* → el producto recién dado de alta
   aparece por caducar.
6. *"¿Qué registré hoy por voz?"* → el resumen cierra el recorrido.

**Si alguien intenta romperla**, que es lo esperable: los nombres de producto y
proveedor aceptan cualquier cosa, incluidas marcas reales; los precios y
cantidades fuera de rango se rechazan con una explicación; cancelar, detener,
pedir ayuda y volver al inicio están atendidos; y una frase sin relación cae en
el manejo de lo no entendido, que repite el menú sin cerrar la sesión.

### 2. Explicar la función de la skill dentro del proyecto

La frase corta, por si hay poco tiempo:

> Es el asistente de voz del almacén. Deja registrar productos y entradas de
> mercancía sin soltar lo que traes en las manos, y avisa qué está por caducar o
> por agotarse.

El desarrollo, si hay tiempo para argumentarlo:

**El problema que resuelve.** Quien recibe mercancía está en el almacén con las
manos ocupadas y las cajas enfrente. Ir a una computadora, iniciar sesión y
llenar un formulario por cada producto es justo lo que hace que la captura se
posponga —y un inventario que se captura tarde es un inventario que miente.

**Por qué estas cuatro acciones y no otras.** Las tres primeras son las del
almacén: dar de alta, surtir y revisar. La cuarta cierra el ciclo respondiendo
"¿qué llevo hecho hoy?", que es lo que uno se pregunta al terminar un turno.
Ninguna es una consulta de estatus: tres escriben o leen datos reales del
sistema y la cuarta agrega información que no existe en ningún otro lado.

**Qué aporta que la web no tenga.** Dos cosas concretas. La bitácora de voz, que
es un registro de lo que se capturó hablando y solo existe en DynamoDB. Y el
proveedor de una compra: el campo existía en la base desde el principio, pero
hasta que se hizo la skill ninguna pantalla lo llenaba.

**Qué decidió el diseño.** La skill no calcula nada. Los precios, las
existencias y los umbrales de las alertas los sigue calculando el backend, y la
voz es otro cliente más de la misma API. Si se cambiara el umbral de caducidad
en el servidor, la voz y la pantalla cambiarían juntas, porque no hay dos
verdades.

### 3. Presentar el diseño de conversación

El diagrama está en [`diseno-conversacion-alexa.html`](./diseno-conversacion-alexa.html),
listo para proyectar o imprimir a PDF en horizontal.

Lo que conviene señalar al mostrarlo, porque es lo que el formato pide y lo que
suele preguntarse:

- **La capa de control tiene cuatro recorridos distintos, y el orden importa.**
  Surtir consulta DynamoDB *antes* que la API porque duplicar una entrada deja
  piezas que no existen en el anaquel; hay que cortar la repetición antes de
  escribir. Registrar consulta la API primero porque el duplicado se decide
  contra Postgres, que es la fuente de verdad: el producto pudo capturarse desde
  la web, donde la bitácora de voz no lo vería. Revisar no persiste nada. Y la
  bitácora solo existe en Dynamo.
- **Los chips F, V y C** están en el orden que pide el formato y corresponden uno
  a uno con el modelo: hay un script que lo verifica.
- **DynamoDB no duplica Postgres.** Guarda tres cosas que solo tienen sentido del
  lado de la voz: la bitácora, la huella que evita el doble dictado y el
  contador de folios `VOZ-XXX`.

### 4. La skill cumple o se acopla a los objetivos del proyecto web

El argumento más fuerte es el sistema de privilegios, que es la pieza calificada
de todo el proyecto integrador.

**La demostración**, para cerrar la presentación:

1. Mostrar que la skill acaba de registrar un producto.
2. Entrar a `/usuarios` en la web como administrador y revocarle
   `productos:crear` al usuario `asistente@scipos.com`.
3. Volver al simulador y decir *"registra un producto nuevo"*.
4. Alexa responde **"No tengo permiso para hacer eso en el sistema"**.

Sin tocar una línea del código de la skill. Lo que se demuestra es que la voz y
la web comparten el mismo control de acceso, y que el backend valida cada acción
en lugar de confiar en quien la pide.

> Los privilegios efectivos se guardan 60 segundos en Redis. Conviene revocar el
> privilegio **antes** de empezar esa parte, o esperar el minuto, para que el
> cambio ya esté surtiendo efecto cuando se pruebe.

Los otros dos argumentos de acoplamiento:

- **La skill usa la misma API, el mismo gateway y la misma base de datos** que la
  interfaz web. No es un sistema paralelo: lo que se dicta aparece en la web al
  instante, porque es el mismo dato.
- **Opera con privilegios mínimos.** El usuario de la skill tiene rol Vendedor y
  exactamente tres privilegios efectivos, porque se le conceden dos y se le
  revocan nueve. Si esas credenciales se filtraran, el daño posible se limita al
  almacén: no pueden vender, ni cobrar, ni tocar clientes.

### Preguntas que conviene llevar contestadas

| Pregunta probable | Respuesta corta |
|---|---|
| ¿Por qué el nombre de invocación no lleva "de"? | Amazon no admite preposiciones ni artículos en el nombre de invocación |
| ¿Qué pasa si digo un producto que no existe? | Al surtir avisa que no lo encontró y sugiere registrarlo; al registrar lo acepta, porque es nuevo |
| ¿Y si repito la misma orden? | La corta con la huella guardada en DynamoDB y responde el mismo resultado |
| ¿Dónde están los datos, en Dynamo o en su base? | En Postgres, igual que la web. Dynamo solo guarda lo propio de la voz |
| ¿Quién calcula los precios? | El backend. La skill nunca manda un precio en la petición |
| ¿Por qué DynamoDB si ya tienen base de datos? | Porque la bitácora, la idempotencia y el folio de voz no son datos del sistema comercial |
