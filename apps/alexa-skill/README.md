# Asistente de almacén — skill de Alexa

Asistente de voz del módulo de inventario de SCIPOS. Permite dar de alta
productos, registrar mercancía que llega, revisar qué está por caducar o por
agotarse, y consultar lo que se registró por voz durante el día.

La skill no calcula precios ni existencias: consume la misma API que la interfaz
web y queda sujeta al mismo sistema de privilegios dinámicos.

## Las cuatro acciones

| Intent | Qué hace | Recorrido |
|---|---|---|
| `RegistrarProductoIntent` | Da de alta un producto en el catálogo | API (consulta) → API (crea) → Dynamo |
| `SurtirInventarioIntent` | Registra una entrada de mercancía | Dynamo → API → Dynamo |
| `RevisarInventarioIntent` | Lee las alertas de caducidad y existencias | solo API |
| `BitacoraVozIntent` | Resume lo dictado hoy | solo Dynamo |

El orden no es casual. **Surtir consulta Dynamo primero** porque duplicar una
entrada deja piezas que no existen en el anaquel, y esa repetición hay que
cortarla antes de escribir. **Registrar consulta la API primero** porque el
duplicado se detecta contra el catálogo, que es la fuente de verdad: el producto
pudo haberse capturado desde la web.

## Archivos

```
modelo-interaccion.json          modelo completo, para el editor JSON de la consola
verificacion/
  modelo-interaccion.spec.js     valida los conteos que exige la evaluación
lambda/
  index.js                       handlers, acceso a Dynamo y a la API
  calculos-almacen.js            lógica pura: búsqueda, folio, idempotencia, frases
  calculos-almacen.spec.js       pruebas de la lógica pura
  package.json                   dependencias que instala la consola
```

`calculos-almacen.js` está separado de `index.js` a propósito: las reglas que
vale la pena probar viven en un módulo sin dependencias, igual que
`calculos-pos.ts` o `alertas-inventario.ts` en el resto del sistema.

## Alta en la consola de Alexa, desde cero

1. Entra a <https://developer.amazon.com/alexa/console/ask> y elige **Create Skill**.
2. Nombre de la skill: `Asistente de almacen SCIPOS`. Idioma principal: **Español (MX)**.
3. Tipo de experiencia: *Other* → *Custom*. Alojamiento: **Alexa-hosted (Node.js)**.
4. Plantilla: *Start from Scratch*.
5. Ya creada, ve a **Build → JSON Editor**, borra todo el contenido y pega
   `modelo-interaccion.json` completo. **Save Model** y luego **Build Model**.
6. Ve a **Code**. Abre `index.js`, borra todo y pega `lambda/index.js`.
7. Crea un archivo nuevo llamado `calculos-almacen.js` **en la misma carpeta que
   `index.js`** y pega `lambda/calculos-almacen.js`.
8. Abre `package.json` y reemplázalo por `lambda/package.json`.
9. En `index.js`, cambia la IP del bloque de conexión (siguiente sección).
10. **Deploy**.

El nombre de invocación es **`asistente almacen`**, en minúsculas, sin tilde y
sin la preposición «de». Se dice: *"Alexa, abre asistente almacén"*.

Amazon rechaza los nombres de invocación que contengan artículos o
preposiciones, y «de» está en esa lista, así que `asistente de almacen` no pasa
la validación de la consola. El nombre queda algo forzado leído en español, pero
es el que la plataforma admite. Al hablar, en cambio, la skill sí se presenta
como «el asistente de almacén», que es donde la frase sí suena natural.

## Datos de conexión

**Las skills alojadas por Alexa no tienen editor de variables de entorno.** Esa
pantalla solo existe cuando el Lambda vive en una cuenta propia de AWS. Por eso
los tres datos de conexión están en un bloque al principio de `lambda/index.js`:

```js
const API_URL = process.env.SCIPOS_API_URL || "http://TU_IP_PUBLICA/api";
const CORREO = process.env.SCIPOS_CORREO || "asistente@scipos.com";
const CONTRASENA = process.env.SCIPOS_CONTRASENA || "Asistente1234";
```

Se leen primero del entorno y caen al valor de la derecha si no existe, así que
mover la skill a un Lambda propio no obliga a tocar el código: bastaría declarar
las variables ahí. En Alexa-hosted siempre se usa el respaldo.

**Lo único que hay que cambiar al pegar el archivo es la IP.** Sustituye
`TU_IP_PUBLICA` por la de la instancia donde corre el sistema. La URL termina en
`/api`, sin barra final y sin puerto: nginx sirve la interfaz en `/` y la API en
`/api` sobre el puerto 80, que es el predeterminado.

`DYNAMODB_PERSISTENCE_TABLE_NAME` sí llega como variable de entorno: la inyecta
Alexa-hosted por su cuenta y no hay que declararla en ningún sitio.

### El runtime de Node es más viejo de lo que parece

El Lambda de una skill alojada por Alexa puede correr sobre **Node 16 o
anterior**, donde no existen ni `fetch` como global (llegó en Node 18) ni
`AbortSignal.timeout` (Node 17.3). Por eso la skill hace sus llamadas con los
módulos `http` y `https` nativos, que existen en cualquier versión.

Se reconoce de un vistazo: si el editor de la consola marca en rojo `?.` o `??`,
su analizador está configurado para una versión vieja de JavaScript, y conviene
no dar por hecho nada más reciente. Esas marcas rojas por sí solas son
cosméticas —si el código de verdad no compilara, la skill no respondería nada—
pero son la señal de que el entorno no es moderno.

Sobre la contraseña en el código: `Asistente1234` es una credencial de
demostración que ya está publicada en la semilla del backend y en el README raíz,
así que tenerla aquí no expone nada nuevo. Si en algún despliegue se cambia con
`SEED_ASISTENTE_PASSWORD`, hay que cambiarla también en esta línea.

**Cuidado con la ruta de productos.** El gateway recorta `/api/productos` y el
controlador del servicio monta sus rutas bajo el prefijo `productos`, así que el
catálogo vive en `/api/productos/productos` —repetido— y las alertas en
`/api/productos/productos/alertas`. Las compras, en cambio, están en
`/api/productos/compras`, porque su controlador monta en `compras`. Si alguna
acción responde "no encontré ese registro", ese es el primer lugar donde mirar.

## Por qué los nombres van en texto libre

Los slots que reciben nombres —`nombreProducto`, `producto` y `proveedor`— son
de tipo **`AMAZON.SearchQuery`**, no un tipo con lista de valores.

La razón es que no hay lista que alcance. Con un tipo de lista, en cuanto
alguien dice algo que no se parece a ningún valor —"chicharrones", "pasta
dental", "Divella"— el slot no se llena, Alexa vuelve a preguntar, y a la
tercera cierra la sesión. Los productos y las marcas de proveedor son
infinitos: la lista solo orientaba a la NLU y nunca fue lo que hacía el trabajo.
Quien resuelve el nombre contra el catálogo real es el Lambda, con
`buscarProducto()`.

`AMAZON.SearchQuery` tiene dos reglas que el modelo debe respetar o falla el
*Build Model*, y que la prueba del repositorio ya verifica:

1. No puede compartir utterance con otro slot. Por eso `SurtirInventarioIntent`
   no tiene muestras del tipo "surte {cantidad} de {producto}".
2. Toda utterance que lo use necesita palabras además del slot. No vale una
   muestra que sea solo `{producto}`.

Como el slot de texto libre arrastra lo que se dijo completo, el Lambda pasa el
valor por `limpiarNombreDictado()` antes de usarlo: quita las muletillas del
principio —"es divella" queda en "divella"— pero solo al inicio, porque en medio
sí significan algo, como en "pasta de dientes".

`SciposTipoRevision` es el único tipo con lista que queda, porque sus tres
opciones sí son cerradas. Lo que no es cerrado es cómo se dicen, así que cada
valor lleva doce sinónimos.

## El usuario de la skill y sus privilegios

La skill inicia sesión como `asistente@scipos.com`, que tiene **rol Vendedor** y
termina con exactamente **tres privilegios efectivos**:

| Privilegio | De dónde viene | Para qué |
|---|---|---|
| `productos:ver` | del rol Vendedor | consultar el catálogo y las alertas |
| `productos:crear` | concedido al usuario | dar de alta productos |
| `compras:ver` | concedido al usuario | registrar entradas de inventario |

Al rol Vendedor se le **revocan** para este usuario los nueve privilegios que la
skill no usa (clientes, cotizaciones y punto de venta). Si las credenciales del
Lambda se filtraran, el daño posible se limita al almacén: no pueden vender, ni
cobrar, ni tocar clientes.

Los tres ajustes están en la semilla, en
`apps/backend/services/seguridad/prisma/seed.ts`.

## Pruebas

Las reglas puras y los conteos del modelo se verifican en el repositorio, sin
levantar nada y sin dependencias:

```bash
pnpm --filter @scipos/alexa-skill test
```

El resto se comprueba en el simulador de la consola, en **Test** con el idioma
en *Español (MX)*:

| Qué se comprueba | Cómo | Qué debe pasar |
|---|---|---|
| Invocación | "abre asistente almacén" | Da la bienvenida y enumera las cuatro acciones |
| Alta de producto | "registra un producto nuevo" | Pide nombre, precio de compra, precio de venta y caducidad; confirma; responde con el lote `VOZ-XXX` |
| Entrada de inventario | "surte inventario" | Pide producto, cantidad y proveedor; responde con la existencia resultante |
| Alertas | "revisa las alertas del inventario" | Pregunta qué grupo y resume el caso más urgente |
| Bitácora | "qué registré hoy por voz" | Cuenta altas, entradas e importe del día |
| Sinónimos de slot | En alertas, responde "vencimientos" | Debe leer solo caducidad, no el resumen general |
| Producto que no está en ninguna lista | Registra "chicharrones" o "pasta dental" | Lo acepta sin repreguntar: el slot es de texto libre |
| Proveedor con nombre de marca | Al surtir, di "Divella" o cualquier marca | Lo acepta y lo guarda tal cual |
| Muletilla pegada al nombre | Responde "es divella" o "el papel higiénico" | Guarda "divella" y encuentra el papel higiénico |
| Volver al inicio | Di "vuelve al inicio" o "página principal" | Repite el menú sin cerrar la sesión |
| Validación mínima | Como precio de compra, di "cero" | Rechaza y vuelve a preguntar sin cerrar la sesión |
| Validación máxima | Como precio de compra, di "doscientos mil" | Rechaza indicando el límite |
| Cantidad inválida | Como cantidad al surtir, di "cero" | Rechaza y vuelve a preguntar |
| Margen negativo | Compra 50, venta 30 | Avisa que la venta debe ser mayor y repregunta solo el precio de venta |
| Fecha pasada | Como caducidad, di una fecha del año pasado | Avisa que ya pasó y repregunta la fecha |
| Cancelar | Di "cancela" a media captura | Termina limpio, sin error |
| Negar la confirmación | Responde "no" a la confirmación final | Dice que canceló y explica cómo reintentar |
| Intent no entendido | Di algo sin relación, como "ponme música" | Responde que no entendió y repite el menú |
| Idempotencia | "surte 50 de leche" dos veces seguidas | La segunda dice que ya la registró, y la existencia en la web subió **una sola vez** |
| Comunicación con la API | Registra por voz y abre `/productos` en la web | El producto aparece con su lote `VOZ-XXX` |
| Persistencia en Dynamo | Haz tres operaciones y pide la bitácora | Los conteos coinciden con lo hecho |
| Privilegios | Ver la sección siguiente | Alexa dice que no tiene permiso |
| Caída del sistema | Apaga el backend y ejecuta una acción | "El sistema no responde en este momento, tu operación no se registró" |

## Demostración del sistema de privilegios

Sirve para mostrar que la skill y la web comparten el mismo control de acceso, y
que basta cambiar un privilegio para que el asistente deje de poder hacer algo,
sin tocar una línea del código de la skill:

1. Entra a la web como `admin@scipos.com` y ve a `/usuarios`.
2. Revoca `productos:crear` al usuario asistente.
3. En el simulador, di "registra un producto nuevo" y completa el diálogo.
4. Alexa responde **"No tengo permiso para hacer eso en el sistema"**.

Los privilegios efectivos se guardan 60 segundos en Redis, así que el cambio
puede tardar hasta un minuto en surtir efecto. Vale la pena esperar ese minuto
antes de dar por fallida la demostración.

## Problemas conocidos

| Síntoma | Causa | Solución |
|---|---|---|
| No aparece **Code → Environment Variables** | Alexa-hosted no tiene esa pantalla; solo existe con un Lambda propio | Los datos van en el bloque de conexión de `index.js`, no en variables |
| Todas las acciones dicen "el sistema no responde" aunque la API sí responda desde el navegador | Alguna función usada no existe en el runtime de la skill: `fetch` y `AbortSignal.timeout` son los sospechosos habituales | Usar `http`/`https` nativos, como ya hace el código. El error real queda en CloudWatch Logs |
| "El sistema no responde" en todas las acciones | La instancia está apagada, no es alcanzable, o quedó `TU_IP_PUBLICA` sin sustituir | Verifica que `http://<ip>/api/seguridad/health` responda desde fuera, y que `API_URL` tenga la IP real |
| "No tengo permiso para hacer eso" al registrar | El usuario asistente no tiene sus privilegios | Ejecuta la semilla de seguridad en la instancia (ver `docs/DESPLIEGUE-AWS.md`) |
| `Cannot find module 'aws-sdk'` en los registros | No se reemplazó el `package.json` de la consola | Pega `lambda/package.json` y vuelve a desplegar |
| `Cannot find module './calculos-almacen'` | Falta el segundo archivo en la consola | Crea `calculos-almacen.js` junto a `index.js` |
| "No encontré ese registro en el sistema" al revisar alertas | Ruta de la API mal escrita | Debe ser `/productos/productos/alertas`, con "productos" repetido |
| La consola rechaza el nombre de invocación | Lleva tilde, o un artículo o preposición como «de» | Debe ser `asistente almacen`: minúsculas, sin tilde y sin «de» |
| Alexa confunde registrar con surtir | El modelo no se reconstruyó tras editar | **Build Model** otra vez y espera a que termine |
| La bitácora sale vacía tras reiniciar | Se está sobrescribiendo el item de Dynamo | El arranque debe leer antes de crear, nunca hacer `put` incondicional |

## Cumplimiento de la rúbrica

El repaso punto por punto de los requerimientos y de la rúbrica de evaluación,
con la evidencia de cada uno, está en
[](../../docs/readmes/cumplimiento-rubrica-alexa.md).
Las cifras que cita las mide la prueba de , no están escritas a
mano.

## Cómo agregar un intent

1. Declara el intent, sus slots y sus prompts en `modelo-interaccion.json`.
2. Si el slot lleva llenado, dale 4 variaciones de elicitación y 8 utterances; si
   lleva validaciones o confirmaciones, 2 variaciones cada una. `verificacion/`
   lo exige y falla si falta alguno.
3. Pon la lógica que valga la pena probar en `calculos-almacen.js`, con su prueba.
4. Escribe el handler en `index.js` y agrégalo a `addRequestHandlers` **antes**
   de `IntentReflectorHandler`, que atrapa todo lo que llegue sin handler propio.
5. Si el intent llama a un endpoint protegido, revisa que el usuario asistente
   tenga ese privilegio en la semilla de seguridad. El backend lo valida siempre.
