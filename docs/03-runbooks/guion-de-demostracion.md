# Guion de demostración

Recorrido de la presentación: quién enseña qué, en qué orden y con qué datos.

El criterio que se protege aquí es explícito: *"la demostración puede recorrer de
principio a fin sin errores funcionales, bloqueos, excepciones visibles ni
necesidad de corregir el sistema durante la exposición"*. Todo lo que sigue está
probado contra el sistema publicado; nada es aspiracional.

**Se ensaya completo al menos una vez antes.** Un guion que solo se leyó no es un
guion.

---

## Antes de entrar

Media hora antes, no cinco minutos antes:

| Comprobación | Cómo | Qué se espera |
|---|---|---|
| El sistema responde | Abrir `http://scipos.tech` | La pantalla de acceso |
| La API rechaza sin sesión | `curl -i http://scipos.tech/api/seguridad/usuarios` | **401** |
| Los cinco usuarios entran | Iniciar sesión con cada uno | Cada quien ve su menú |
| Hay caja abierta | Entrar como cajero a *Caja* | Turno abierto, o abrirlo |
| La skill contesta | *"Alexa, abre asistente almacen"* | El saludo de bienvenida |

Y en la máquina que va a proyectar:

- **Sesión ya iniciada como administrador**, con el navegador en `/inicio`.
- **Una ventana de incógnito aparte** para el segundo usuario. Sin ella hay que
  cerrar sesión en vivo cada vez, que es lento y da la impresión de improvisar.
- **Zoom del navegador al 100%** y la barra de marcadores oculta.
- **El teléfono con el sistema abierto**, para el momento del responsive.
- **Notificaciones del sistema operativo apagadas.**

> La sesión se guarda por pestaña, así que la ventana de incógnito puede tener
> un usuario distinto a la ventana normal al mismo tiempo. Eso permite enseñar
> dos roles en paralelo sin cerrar sesión.

### Credenciales

| Usuario | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@scipos.com` | `Admin1234` |
| Vendedor | `vendedor@scipos.com` | `Vendedor1234` |
| Cajero | `cajero@scipos.com` | `Cajero1234` |
| Supervisor | `supervisor@scipos.com` | `Supervisor1234` |
| Asistente de voz | `asistente@scipos.com` | `Asistente1234` |

*(Si el despliegue definió `SEED_*_PASSWORD`, valen esas.)*

---

## El recorrido

Unos 20 minutos. Los tiempos son de referencia; lo que no se puede recortar son
los tres momentos marcados como **clave**.

### 1 · Apertura y el sistema de privilegios — Leobardo · 5 min · **CLAVE**

Es lo primero porque es lo que más pesa en la calificación, y porque explica todo
lo que viene después.

1. **Entrar como administrador.** Señalar el menú: diez módulos.
2. **En la ventana de incógnito, entrar como vendedor.** Menú lado a lado:
   sin *Usuarios*, sin *Caja*, sin *Punto de compra*, sin *Reportes*.

   > "El menú no está escrito a mano por rol. Cada módulo declara qué privilegio
   > exige y el menú se dibuja con los privilegios que el backend le devolvió a
   > este usuario."

3. **Enseñar que no es solo la interfaz.** Con el vendedor, escribir
   `scipos.tech/reportes` en la barra de direcciones. Aparece la pantalla 403
   dentro del marco.

   > "Aunque conozca la dirección, no entra. Y aunque la interfaz fallara, el
   > endpoint la rechaza igual."

4. **El momento que hay que hacer sí o sí.** Como administrador, ir a
   *Usuarios* → supervisor → revocarle **`reportes:utilidad`**. Volver a la
   sesión del supervisor, recargar reportes: **la pestaña de Utilidad
   desapareció**, y las otras cuatro siguen ahí.

   > "No le cambiamos el rol: sigue siendo supervisor. Le quitamos un privilegio
   > concreto. Y no es solo que se esconda la pestaña: si pide esa dirección
   > directamente, la API le responde 403."

5. **Devolverle el privilegio** antes de seguir. No se deja el sistema a medias.

**Si preguntan cómo funciona por dentro:** los privilegios efectivos son los del
rol, más los concedidos al usuario, menos los revocados. Una revocación
individual le gana incluso a un rol con acceso total, y esa regla está fijada por
prueba automatizada.

### 2 · Productos y compras — José · 3 min

1. *Productos*: buscar, filtrar por estado y por tipo.
2. Crear un producto con lote y caducidad. Enseñar que valida mientras se
   escribe, sin esperar a enviar.
3. **Los dos precios**, compra y venta. Es lo que después permite calcular la
   utilidad.
4. *Punto de compra*: registrar una compra con proveedor. **El inventario
   sube.** Segunda pestaña: el historial, que es el único lugar del sistema
   donde se lee el proveedor.

**Si preguntan por la documentación de la API:** abrir `/docs` de un servicio.
El contrato se escribe antes que el endpoint, los seis contratos están
versionados en el repositorio, y la integración continua los valida en cada
empujón.

### 3 · Clientes y comunicación entre servicios — Jassiel · 2 min

1. Crear un cliente. El teléfono exige diez dígitos mientras se escribe.
2. **Abrir el detalle de un cliente que ya tenga movimiento.** Las pestañas de
   cotizaciones y ventas.

   > "Este historial no sale de la base de clientes. El servicio de clientes le
   > pregunta por REST a cotizaciones y a ventas. Si uno de los dos no
   > contestara, la pantalla muestra lo que sí consiguió y avisa que falta una
   > parte, en vez de quedarse en blanco."

### 4 · Cotizaciones y conversión a venta — Angel · 3 min

1. Crear una cotización con dos o tres productos. **El folio lo pone el
   servidor** (`COT-000001`), igual que los totales.
2. *Marcar como enviada* → *Convertir a venta*.
3. Enseñar que la cotización quedó en **VENDIDA** y que la venta existe en caja.

   > "Convertir toca dos servicios: crea la venta en uno y marca la cotización
   > en el otro. Si alguien da doble clic, no se cobra dos veces: la operación
   > es idempotente."

### 5 · Punto de venta, caja y responsive — Alejandro · 4 min · **CLAVE**

1. **Como cajero:** abrir caja con un fondo inicial.
2. Armar un carrito, cobrar. **El inventario baja.**
3. Intentar aplicar un descuento: el cajero **no puede**. Cambiar a la sesión
   del supervisor y aplicarlo desde ahí.
4. **Descargar el comprobante PDF.**
5. Registrar un movimiento manual y hacer el **corte de caja**.
6. **Sacar el teléfono.** Abrir el punto de venta en el celular: el menú es un
   cajón que se abre desde el botón, las tarjetas se apilan y las tablas se
   desplazan solas por dentro sin que la página se desborde.

**El mejor momento para explicar una decisión técnica:**

> "Al principio el navegador mandaba el precio en la petición de venta. Quien
> abriera la consola podía vender un producto de mil pesos en uno. Hoy la
> petición lleva solo el identificador del producto y la cantidad: el precio lo
> lee el servidor del catálogo. El descuento igual, y solo se aplica si quien lo
> pide tiene el privilegio."

### 6 · Reportes y utilidad — Angel · 2 min

1. Como supervisor: las cinco pestañas, con filtro por periodo.
2. **Utilidad**: ingresos, costo de ventas, descuentos, margen.
3. **Exportar un CSV.** Y decir por qué importa dónde se arma:

   > "El archivo lo genera el servidor, no el navegador. Exportar es su propio
   > privilegio, y si el archivo se armara con los datos que la pantalla ya
   > tiene, esconder el botón sería toda la protección."

### 7 · El almacén por voz — Leobardo · 4 min · **CLAVE**

Es el cierre porque es lo que se recuerda.

1. *"Alexa, abre asistente almacen."*
2. **Registrar un producto hablando.** Al terminar, **recargar el catálogo en el
   navegador: ahí está.**
3. **Surtir inventario.** La existencia sube en la pantalla.
4. Preguntar por el inventario: contesta las alertas de caducidad y existencias.
5. Pedir la bitácora: resume lo dictado en el día.

**Y el remate, que amarra el cierre con la apertura:**

Desde *Usuarios*, revocarle a `asistente@scipos.com` el privilegio
`productos:crear`. Pedirle a Alexa que registre otro producto: **responde que no
tiene permiso**.

> "No tocamos el código de la skill. La voz pasa por el mismo sistema de
> privilegios que la web, porque inicia sesión como un usuario más."

Devolverle el privilegio al terminar.

> Los privilegios se guardan 60 segundos en caché. Entre revocar y probar,
> **esperar un minuto**. Si se prueba de inmediato puede seguir funcionando, y
> parecerá que no sirve cuando en realidad sí.

---

## Los tres momentos que más puntúan

Si el tiempo se acorta, se recorta lo demás y estos se conservan:

1. **La revocación en vivo de un privilegio** (paso 1.4). Es la diferencia entre
   "tenemos roles" y "tenemos privilegios dinámicos", que es lo que se evalúa.
2. **El responsive en un teléfono de verdad** (paso 5.6). Una captura no
   convence; el aparato en la mano sí.
3. **Alexa escribiendo en la base y después quedándose sin permiso** (paso 7).
   Demuestra integración y sistema de privilegios en el mismo gesto.

---

## Preguntas que conviene llevar contestadas

**"¿Los microfrontends son de verdad independientes si se despliegan juntos?"**
Cada uno es una aplicación Next completa, con su propio `layout`, su puerto y su
propio `build`; se levanta sola con
`pnpm --filter @scipos/pos-caja-front dev`. Se despliegan juntos por decisión,
no por acoplamiento: con un servidor y cinco personas, publicar siete artefactos
por separado sería más ceremonia que beneficio.

**"¿Por qué una sola base de datos?"** Un esquema por servicio y ninguno lee el
de otro: lo cruzado va por REST. Separarlas en instancias distintas es cambiar
seis `DATABASE_URL`, ni una línea de lógica. Sobre una máquina, seis procesos de
base compitiendo por la misma memoria no aportan nada.

**"¿Qué patrones aplicaron?"** Strategy en el proveedor de privilegios, módulo
dinámico para registrar el guard, decorador para declarar el permiso junto al
endpoint, adaptador en el cliente HTTP, fachada en reportes, caché-aparte con
invalidación en privilegios. Y los cinco principios SOLID con su ejemplo, en
[patrones y SOLID](../01-architecture/patrones-y-solid.md).

**"¿Por qué no usaron Kafka?"** Porque no hay ningún consumidor que necesite el
historial de eventos. Los reportes se calculan del estado actual en menos de un
segundo. Sería un servicio más que mantener sin nadie que lo escuche.

**"¿Cómo saben que funciona?"** 129 pruebas en seis paquetes, sin base de datos
ni navegador, más lint, tipos y construcción completa. Lo corre GitHub Actions en
cada empujón.

**"¿Y si se cae un servicio?"** El gateway responde 502 con la misma forma de
error que el resto. El historial del cliente devuelve lo que consiguió y declara
qué fuente falló. El cliente HTTP corta a los cinco segundos.

---

## Si algo falla en vivo

**Que nadie abra una terminal a arreglarlo.** La rúbrica penaliza "necesidad de
corregir el sistema durante la exposición" más de lo que penaliza un módulo que
se salta.

| Qué pasó | Qué hacer |
|---|---|
| Una pantalla no carga | Recargar una vez. Si no, seguir con el módulo siguiente y volver al final |
| Sale la pantalla 503 | El servicio está reiniciando. Continuar con otro módulo; suele volver en menos de un minuto |
| Un botón da 403 y no debería | Es el privilegio en caché. Decirlo tal cual —"acabamos de cambiar este permiso, tarda hasta un minuto"— y seguir |
| Alexa no entiende | Repetir la frase completa una vez. A la segunda, pasar a otro intent y volver al final |
| El sistema no responde | Enseñar el mismo recorrido en local (`pnpm dev`), diciendo que es el mismo código |

**Lo último:** el sistema **no se toca el día de la presentación**. Ni un
despliegue "rapidito", ni una semilla, ni un `git pull` en el servidor. Lo que
esté publicado la noche anterior es lo que se presenta.
