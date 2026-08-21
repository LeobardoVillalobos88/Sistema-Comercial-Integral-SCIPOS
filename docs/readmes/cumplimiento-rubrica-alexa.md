# Cumplimiento de la rúbrica — skill de Alexa

Repaso punto por punto de los requerimientos y de la rúbrica de evaluación,
con dónde se cumple cada uno y cómo comprobarlo. Los criterios de presentación
quedan fuera: dependen del equipo, no del código.

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

## Qué queda fuera del código

Los cuatro criterios de presentación —mostrar la skill en Amazon Developer,
explicar su función dentro del proyecto, presentar el diseño de conversación y
justificar cómo se acopla al proyecto web— dependen del equipo. El material está
listo: el diagrama para proyectar, este documento para preparar la defensa, y la
demostración de privilegios como cierre.
