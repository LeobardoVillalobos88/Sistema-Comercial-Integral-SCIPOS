# Decisiones técnicas

Las decisiones que dieron forma al sistema, con lo que se descartó y por qué. El
orden es de mayor a menor consecuencia: las primeras son las que costaría más
revertir.

Las tecnologías obligatorias del enunciado —Next.js, TypeScript, MUI, NestJS,
Prisma, PostgreSQL, OpenAPI, JWT, microfrontends, microservicios— no aparecen
aquí: venían dadas. Lo que sí aparece es cómo se decidió usarlas.

---

## 1. Un monorepo, no once repositorios

**Contexto.** El sistema son 16 paquetes: 7 frontend, 8 backend y la skill de voz.

**Decisión.** Todo en un repositorio con pnpm workspaces y Turborepo.

**Alternativa descartada:** un repositorio por servicio. Es lo que se hace cuando
cada servicio tiene su propio equipo y su propio calendario de publicación. Aquí
somos cinco personas trabajando sobre el mismo módulo la misma semana: un cambio
en `backend-commons` habría necesitado publicar un paquete, subir la versión en
seis repositorios y abrir seis pull requests. Con un monorepo es un commit.

**Lo que se paga.** Todo se construye junto, así que la construcción completa
tarda más, y en el servidor eso importa (por eso la imagen limita la concurrencia
a dos tareas). Turborepo lo compensa con caché: `pnpm test` sobre un repositorio
sin cambios termina en dos segundos.

## 2. Una sola imagen de Docker para los siete procesos del backend

**Decisión.** El gateway y los seis servicios arrancan de la misma imagen. Cada
uno es su propio contenedor y su propio proceso; lo que cambia es el
`working_dir` del compose, que decide cuál arranca.

**Por qué.** Los siete comparten monorepo, dependencias y `backend-commons`.
Siete imágenes serían siete copias casi idénticas de varios GB: multiplicaría por
siete el tiempo de construcción y el disco de una instancia que tiene 30 GB.

**Qué no se sacrificó.** La independencia real: cada servicio conserva su puerto,
su esquema de PostgreSQL, su ciclo de vida y su health check. Se pueden reiniciar
por separado. Lo único compartido es el artefacto del que arrancan.

**Cuándo habría que deshacerlo.** Si un servicio necesitara una dependencia
nativa que los demás no tienen, o si se publicaran por separado. Ninguna de las
dos pasa hoy.

## 3. Un PostgreSQL con un esquema por servicio

**Decisión.** Una base `scipos` con seis esquemas: `seguridad`, `productos`,
`clientes`, `cotizaciones`, `ventas_caja`. Reportes no tiene.

**La regla que lo sostiene:** ningún servicio lee el esquema de otro. Los datos
cruzados viajan por REST. `ventas-caja` no consulta la tabla de productos: le
pregunta al servicio de productos.

**Alternativa descartada:** una instancia de PostgreSQL por servicio. Es lo
correcto cuando cada base tiene su propio perfil de carga o su propio respaldo.
Sobre una máquina son seis procesos de base de datos compitiendo por la misma
memoria para nada.

**Lo importante es que el cambio es barato.** Como el aislamiento se respeta en
el código y no solo en la configuración, separar en instancias distintas es
cambiar seis `DATABASE_URL`. Ni una línea de lógica.

## 4. RS256 con JWKS, no un secreto compartido

**Decisión.** El servicio de seguridad firma los tokens con una llave RSA privada
y publica la pública en `GET /.well-known/jwks.json`. El gateway y los seis
servicios verifican contra ese JWKS.

**Alternativa descartada:** HS256 con un secreto compartido. Es más simple de
montar, y tiene un problema que no se ve hasta que importa: **con HS256, quien
puede verificar también puede firmar**. El secreto estaría en los siete
servicios, así que un fallo en cualquiera de ellos —el de reportes, el que menos
importa— entregaría la capacidad de emitir tokens de administrador.

Con RS256 solo seguridad tiene la privada. Los demás pueden comprobar firmas y no
pueden falsificarlas. Las llaves no se versionan (`keys/` está en `.gitignore`):
cada instalación genera las suyas con `pnpm generar:llaves`.

## 5. Access corto, refresh rotatorio y lista de revocados

**Decisión.** El access token dura 15 minutos. Va acompañado de un refresh token
rotatorio, guardado con hash y con `familyId`. Al cerrar sesión, el `jti` del
access entra a una lista de revocados en Redis.

**El problema de fondo.** Un token firmado es válido hasta que expira, y no hay
forma de "desfirmarlo". Con esto se atacan las dos mitades:

- **Cerrar sesión de verdad.** Sin la lista de revocados, cerrar sesión solo
  borraría el token del navegador; una copia seguiría abriendo puertas 15
  minutos. Con ella, el corte es inmediato y en los siete servicios a la vez.
- **Robo de refresh.** Los refresh viven una semana, así que uno robado sería
  peor que un access robado. Por eso rotan: cada uso entrega uno nuevo e
  invalida el anterior. Si aparece uno ya consumido, es que hay dos manos usando
  la misma sesión, y **se revoca la familia completa**. El legítimo pierde la
  sesión y tiene que volver a entrar; el ladrón también. Preferimos la molestia.

**Lo que se paga.** Redis pasa a ser parte del camino de autenticación. Se
mitigó: si Redis no responde, la verificación de la lista no bloquea al sistema
—se pierde la revocación inmediata, no el acceso.

## 6. Los microfrontends son paquetes del workspace, no remotos federados

**Decisión.** Cada módulo es un paquete `@scipos/<dominio>-front` que el armazón
consume como dependencia normal y transpila con `transpilePackages`.

**Alternativa descartada:** Module Federation de webpack, o iframes.

**Por qué.** Federar de verdad significa que cada microfrontend se publica por su
cuenta y el armazón lo carga en tiempo de ejecución. Eso vale la pena cuando
equipos distintos publican en momentos distintos —y trae su costo: versionado de
dependencias compartidas entre remotos, React duplicado si algo se desalinea, y
una pantalla en blanco cuando un remoto no carga. Con Next.js App Router,
además, el soporte no es de primera clase.

**Qué sí se conservó, y es lo que se evalúa.** Cada microfrontend es **una
aplicación Next.js completa e independiente**: tiene su `layout.tsx`, su
`page.tsx`, sus providers, su puerto y su propio `build`. Se puede levantar sola:

```bash
pnpm --filter @scipos/pos-caja-front dev   # el POS solo, en el 3006
```

Eso es lo que hace real la separación: no es que el código esté en carpetas
distintas, es que cada módulo arranca sin el armazón. Los límites están donde
importa —contrato de props, dependencias declaradas, ninguna importación cruzada
entre módulos hermanos— y el precio se paga solo en el despliegue, que es una
unidad.

**Consecuencia honesta:** hoy se despliegan juntos. Es la única concesión, y es
consciente: con cinco personas y un servidor, publicar siete artefactos de
frontend por separado sería más ceremonia que beneficio.

## 7. El armazón embebe módulos; no los enruta por iframe

Cada ruta del armazón importa el componente raíz del microfrontend:

```tsx
// web-shell/src/app/productos/page.tsx
import { CatalogoProductos } from "@scipos/productos-front";
```

Con iframes el aislamiento sería total y también lo serían los problemas:
sesión duplicada, altura que nunca cuadra, avisos atrapados dentro del marco y
teclado que no navega entre módulos. El sistema comparte sesión y tema entre
módulos; el iframe estorbaría a las dos cosas.

## 8. nginx como único puerto publicado

**Decisión.** En el servidor solo nginx publica un puerto. La interfaz sale por
`/`, la API por `/api/`. Los servicios 4001-4006, PostgreSQL y Redis quedan en la
red interna de Docker.

**Dos beneficios de una decisión.** El de seguridad: la base de datos no es
alcanzable desde internet, ni por accidente. Y el de simplicidad: interfaz y API
comparten origen, así que el navegador no hace peticiones de origen cruzado y no
hay lista de orígenes que actualizar cada vez que cambia la dirección.

De ahí sale otra decisión pequeña con consecuencias: **`NEXT_PUBLIC_API_URL` es
`/api`, una ruta relativa**. Next resuelve esas variables al compilar, no al
arrancar; con una dirección absoluta habría que reconstruir la imagen cada vez
que cambiara el dominio o la IP. Con la ruta relativa, la misma imagen sirve en
cualquier host.

## 9. Los totales se calculan en el servidor, siempre

**Decisión.** Subtotales, descuentos y totales se calculan en el backend. El
frontend los muestra; no los propone.

**Por qué es una decisión y no una obviedad.** Empezó al revés. El POS mandaba el
precio en la petición, y quien abriera la consola del navegador podía vender un
producto de mil pesos en uno. Hoy la petición lleva solo `productoId` y
`cantidad`, y el precio sale del catálogo.

El descuento sigue la misma lógica: se pide, pero solo se aplica si quien lo pide
tiene `pos:descuento`. Se verifica con el mismo proveedor de privilegios que usa
el guard, no con lo que diga el cliente.

En cotizaciones se usa `decimal.js` en vez de números de punto flotante, porque
en dinero `0.1 + 0.2` no puede dar `0.30000000000000004`.

## 10. Pruebas sobre lógica pura, sin runner extra

**Decisión.** Seis paquetes tienen pruebas, todas sobre `node:test` —el runner
que trae Node— ejecutado con `tsx`. Ninguna dependencia de prueba nueva.

**Alternativa descartada:** Jest o Vitest. Traen mucho: mocks, cobertura,
snapshots, componentes renderizados. También traen configuración, transformadores
y un árbol de dependencias grande.

**Lo que se prefirió.** Sacar la lógica que vale la pena probar a módulos puros
—`calculos-pos.ts`, `calculos-cotizacion.ts`, `alertas-inventario.ts`,
`csv.ts`— y probarlos sin montar nada. Ninguna de las 129 pruebas necesita base
de datos, Redis ni navegador. Corren en menos de dos minutos, así que se corren.

**El límite, dicho claro.** No hay pruebas de componentes renderizados ni de
extremo a extremo. Las cuentas y las reglas están cubiertas; que un botón se
pinte donde debe, no. Es la deuda consciente de este proyecto.

## 11. Biome en lugar de ESLint más Prettier

Una herramienta, un archivo de configuración, y termina en menos de un segundo
sobre 305 archivos. Con ESLint y Prettier serían dos configuraciones que hay que
mantener de acuerdo, y varios segundos en cada `pre-commit`.

Tiene dos excepciones que valen la pena documentar porque no son pereza:

- **`useImportType` está apagada en todo `apps/backend/`.** Su corrección
  automática convierte `import { Servicio }` en `import type { Servicio }`, y eso
  **borra la clase en tiempo de ejecución**. NestJS la necesita ahí para
  inyectarla: el resultado es un fallo de inyección al arrancar, sin error de
  compilación que lo anticipe.
- **Cuatro reglas están apagadas en `apps/alexa-skill/lambda/`.** Ese código se
  pega en la consola de Alexa, cuyo entorno es más viejo de lo que parece:
  `?.`, el prefijo `node:` y los escapes `\p{...}` o no existen o el editor los
  marca en rojo. El archivo es deliberadamente anticuado porque tiene que correr
  ahí.

## 12. Español en todo el código

Identificadores, comentarios, mensajes de error y textos de interfaz están en
español (`usePermisos`, `MATRIZ_PRIVILEGIOS`, `calcularTotales`).

Mezclar idiomas produce cosas como `getUsuarioActivo` o `crearOrderDetail`, y
mantener un glosario mental de traducción entre lo que dice el requerimiento
("privilegio", "cotización", "corte de caja") y lo que dice el código. El
enunciado, el negocio y el equipo están en español; el código también.

Los mensajes de error del backend llegan en español al usuario final tal cual,
sin capa de traducción.

---

## Deudas conocidas

Se listan porque existen, no porque se vayan a resolver mañana.

| Deuda | Estado |
|---|---|
| Sin pruebas de extremo a extremo ni de componentes | Consciente. La lógica de negocio sí está cubierta |
| PostgreSQL corre en la misma instancia, no administrado | Sobre AWS Academy, una base administrada agrega costo y configuración de red para el mismo resultado funcional. El código no cambiaría: es una `DATABASE_URL` |
| Un solo servidor, sin balanceador ni escalado | La carga es una demostración. Un balanceador delante de una instancia no balancea nada |
| Sin pagos mixtos | Está en la lista de "extra avanzado" del enunciado. Requiere migración sobre datos ya desplegados |
| Sin Kafka | Ningún consumidor lo necesita. Ver el apartado 4 de [patrones y SOLID](./patrones-y-solid.md) |
