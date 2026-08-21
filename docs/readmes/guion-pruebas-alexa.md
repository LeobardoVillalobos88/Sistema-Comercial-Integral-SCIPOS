# Guion de pruebas de la skill

Recorrido completo para probar la skill copiando y pegando en el simulador, sin
tener que acordarse de nada. Cada bloque dice qué criterio de la rúbrica prueba,
qué escribir y qué debe responder.

**Cómo usarlo:** abre la consola de Alexa en **Test**, pon el idioma en *Español
(MX)*, y ve pegando las frases en el orden en que aparecen. Las líneas en
`código` son para copiar tal cual.

Si algo falla, anota **la frase exacta que escribiste** y **lo que respondió
Alexa**. Con eso se localiza el problema rápido; sin eso, hay que adivinar.

---

## Antes de empezar

- Ten abierta en otra pestaña la interfaz web en `/productos`. Varias pruebas se
  confirman viendo el dato aparecer ahí.
- Ten a la mano `/usuarios` para el bloque de privilegios.
- Si acabas de cambiar el modelo, asegúrate de haber dado **Build Model** y no
  solo *Deploy*: son botones distintos y hacen cosas distintas.

---

## Bloque 1 · Invocación

> Prueba el criterio funcional 1: Alexa reconoce el nombre de invocación.

```
abre asistente almacen
```

**Debe responder** con la bienvenida y las cuatro acciones: *"Bienvenido al
asistente de almacén. Puedes decir: registra un producto nuevo, surte
inventario, revisa las alertas del inventario, o pregúntame qué registraste hoy.
¿Qué necesitas?"*

Si contesta *"no sé cómo ayudarte con eso"*, el nombre no se reconoció: revisa
que sea exactamente `asistente almacen`, sin tilde y sin "de".

---

## Bloque 2 · Registrar un producto, camino completo

> Prueba los criterios funcionales 2, 4 y 9, y el no funcional 6.

Este bloque usa **"chicharrones"** a propósito: era uno de los nombres que
tumbaban la sesión antes de pasar los slots a texto libre.

| Paso | Escribe | Alexa debe |
|---|---|---|
| 1 | `registra un producto nuevo` | Preguntar cómo se llamará |
| 2 | `chicharrones` | Confirmar el nombre |
| 3 | `si` | Preguntar el precio de compra |
| 4 | `10` | Preguntar el precio de venta |
| 5 | `18` | Confirmar el precio de venta |
| 6 | `si` | Preguntar la caducidad |
| 7 | `el 30 de agosto` | Confirmar la fecha |
| 8 | `si` | Pedir la confirmación final |
| 9 | `si` | **Registrarlo** y decir el lote `VOZ-XXX` |

**Al terminar**, abre `/productos` en la web: "chicharrones" debe estar ahí, con
su lote, sin existencias y con la caducidad que dictaste.

> Se usa una fecha cercana a propósito, para que el producto salga en las alertas
> del bloque 6. Si hoy ya pasó el 30 de agosto, usa cualquier fecha dentro de los
> próximos catorce días.

---

## Bloque 3 · Que no dejen pasar datos erróneos

> Prueba el criterio funcional 4: las validaciones no permiten datos erróneos.

Cada prueba es independiente. Empieza cada una diciendo `registra un producto
nuevo`, y cuando llegues al paso que se indica, mete el valor malo.

| Qué se prueba | Dónde | Escribe | Debe |
|---|---|---|---|
| Precio en cero | Precio de compra | `0` | Rechazarlo y volver a preguntar |
| Precio disparado | Precio de compra | `200000` | Decir que pasa del límite de cien mil |
| Cantidad en cero | Cantidad al surtir | `0` | Decir que debe ser al menos una pieza |
| Cantidad disparada | Cantidad al surtir | `9000` | Decir que no puede pasar de cinco mil |

**En ninguno de los cuatro debe cerrarse la sesión.** Alexa vuelve a preguntar y
el diálogo continúa donde estaba.

### Las dos reglas que no son de rango

Estas las revisa el código, no el modelo, y son más interesantes de mostrar:

**Vender más barato de lo que cuesta.** En un registro nuevo:

```
registra un producto nuevo
```
```
jabon de prueba
```
```
si
```
```
50
```
```
30
```

**Debe** decir que el precio de venta tiene que ser mayor al de compra, y
volver a preguntar **solo ese precio** — no reinicia el diálogo ni te vuelve a
pedir el nombre.

**Fecha que ya pasó.** Continúa el mismo diálogo con un precio válido y luego,
en la caducidad:

```
el 5 de enero de 2020
```

**Debe** decir que esa fecha ya pasó y volver a preguntar solo la fecha.

---

## Bloque 4 · Surtir inventario

> Prueba los criterios funcionales 2, 3 y 9.

Usa **"Divella"** como proveedor: era el otro nombre que tumbaba la sesión.

| Paso | Escribe | Alexa debe |
|---|---|---|
| 1 | `surte inventario` | Preguntar qué producto |
| 2 | `chicharrones` | Confirmar el producto |
| 3 | `si` | Preguntar la cantidad |
| 4 | `50` | Preguntar el proveedor |
| 5 | `Divella` | Pedir la confirmación final |
| 6 | `si` | Decir que entraron 50 piezas y **cuántas hay ahora** |

**Al terminar**, en `/productos` la existencia de "chicharrones" debe haber
pasado de 0 a 50. Y en `/compras`, pestaña **Historial de compras**, debe
aparecer la compra con proveedor "Divella".

---

## Bloque 5 · Que repetir no duplique

> Prueba el criterio funcional 10: mismo resultado al ejecutar varias veces.

**Inmediatamente después** del bloque 4, sin esperar dos minutos, repite lo
mismo:

```
surte inventario
```
```
chicharrones
```
```
si
```
```
50
```
```
Divella
```
```
si
```

**Debe responder** *"Esa entrada ya la registré hace un momento"* y repetir el
resultado anterior.

**Comprueba en la web** que la existencia **sigue en 50**, no en 100. Esa es la
prueba: no basta con que lo diga, tiene que no haber escrito.

---

## Bloque 6 · Revisar el inventario

> Prueba el criterio funcional 9 y el manejo de sinónimos.

```
revisa las alertas del inventario
```

Preguntará qué quieres revisar. Prueba las tres respuestas, una por vuelta:

| Escribe | Debe |
|---|---|
| `caducidad` | Leer **solo** los lotes vencidos y por vencer |
| `vencimientos` | Lo mismo — es un sinónimo, no el valor exacto |
| `existencias` | Leer **solo** lo agotado y lo que se está acabando |
| `no se` | Leer **ambos** grupos |

"Chicharrones", que registraste con caducidad cercana, debe aparecer entre lo
que está por vencer.

La prueba de `vencimientos` importa más de lo que parece: el slot entrega la
frase tal como se escuchó, no el valor canónico del tipo, así que si esto
funciona quiere decir que los sinónimos se están interpretando bien.

---

## Bloque 7 · La bitácora del día

> Prueba el criterio funcional 8: uso de DynamoDB.

```
que registre hoy por voz
```

**Debe responder** con los conteos de lo que llevas hecho: cuántos productos
nuevos, cuántas entradas de inventario, por cuánto dinero, y cuál fue la última
operación.

Contrasta el número con lo que hiciste. Si registraste un producto y una
entrada, debe decir exactamente eso.

Prueba también estas dos formas, para ver que reconoce el intent de varias
maneras:

```
cuantas operaciones llevo hoy
```
```
dame el resumen del dia
```

---

## Bloque 8 · Intentar matarla

> Prueba los criterios funcionales 2, 3, 6 y 7. Es el bloque que más importa si
> los profesores van a buscarle fallas.

### Nombres que no están en ninguna lista

Registra productos con estos nombres, uno por vuelta. Todos deben pasar sin
repreguntar:

```
pasta dental
```
```
carne de cerdo
```
```
detergente para trastes
```
```
galletas de animalitos
```

Y estos como proveedor al surtir:

```
Divella
```
```
La Costeña
```
```
distribuidora Garcia Hermanos
```

### Muletillas pegadas al nombre

El slot de texto libre arrastra lo que se dijo completo. Responde así cuando
pregunte el proveedor o el producto:

```
es divella
```
```
el papel higienico
```

**Debe** guardar "divella" sin el "es", y encontrar el papel higiénico.

### Cancelar y salir

| Escribe | Cuándo | Debe |
|---|---|---|
| `cancela` | A media captura de slots | Terminar limpio, sin error |
| `para` | Durante un diálogo | Despedirse |
| `ayuda` | En cualquier momento | Explicar las cuatro acciones |
| `vuelve al inicio` | En cualquier momento | Repetir el menú sin cerrar la sesión |

### Negar la confirmación

Llega hasta la confirmación final de un registro y responde:

```
no
```

**Debe** decir que canceló y explicar cómo reintentar. No debe quedarse muda ni
cerrar la sesión.

### Decir algo que no tiene nada que ver

```
ponme musica
```
```
que hora es
```
```
cuentame un chiste
```

**Debe** decir que no entendió y repetir el menú. No debe cerrar la sesión ni
contestar con un nombre técnico como "AMAZON.FallbackIntent".

### Un producto que no existe, al surtir

```
surte inventario
```
```
cemento
```

**Debe** decir que no lo encontró en el catálogo y sugerir registrarlo. No debe
reventar.

---

## Bloque 9 · La demostración de privilegios

> Prueba el criterio funcional 9 y el acoplamiento con el proyecto web. Es el
> mejor cierre para la presentación.

1. En la web, entra como `admin@scipos.com` y ve a **`/usuarios`**.
2. Revócale el privilegio `productos:crear` al usuario `asistente@scipos.com`.
3. **Espera un minuto.** Los privilegios se guardan 60 segundos en Redis.
4. En el simulador:

```
registra un producto nuevo
```

Completa el diálogo. Al final **debe responder** *"No tengo permiso para hacer
eso en el sistema"*.

5. Vuelve a concederle el privilegio para dejar todo como estaba.

Lo que se demuestra: la voz y la web comparten el mismo control de acceso, y
cambió el comportamiento de la skill **sin tocar una línea de su código**.

---

## Bloque 10 · Cuando el sistema no responde

> Prueba el criterio funcional 6. Opcional, porque requiere apagar el backend.

Si tu compañero puede detener el gateway un momento:

```
revisa las alertas del inventario
```
```
todo
```

**Debe responder** *"El sistema no responde en este momento, tu operación no se
registró"* y ofrecer intentar otra cosa. Lo importante es que **diga que no se
registró**: eso es lo que la persona necesita saber para no quedarse con la duda.

---

## Prueba rápida, para el día de la presentación

Si solo tienes dos minutos antes de pasar, corre esto:

```
abre asistente almacen
```
```
revisa las alertas del inventario
```
```
todo
```
```
que registre hoy por voz
```

Con eso confirmas de un tirón que la invocación funciona, que la API responde y
que DynamoDB está accesible. Si esos tres pasan, el resto va a pasar.

---

## Si algo falla

Anota **la frase exacta** y **la respuesta exacta**. Las respuestas distinguen la
causa:

| Lo que dice Alexa | Dónde está el problema |
|---|---|
| "No pude iniciar sesión en el sistema" | El usuario o la contraseña del bloque de conexión |
| "El sistema no responde en este momento" | Red, o la IP de `API_URL` está mal o desactualizada |
| "No tengo permiso para hacer eso" | Llegó a la API: faltan privilegios al usuario asistente |
| "No encontré ese registro en el sistema" | Una ruta de la API mal escrita |
| Repregunta lo mismo una y otra vez | Un slot que no se llena |
| Dice un nombre técnico como "AMAZON.algo" | Un intent declarado sin handler |

Para las tres primeras, **CloudWatch Logs** —desde la pestaña *Code* de la
consola— tiene el error real: todo fallo de red se registra antes de convertirse
en frase. Busca las líneas que empiezan con `No se pudo alcanzar la API` o
`La API respondió`.
