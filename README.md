# SCIPOS · Sistema Comercial Integral

Plataforma comercial integral (productos, clientes, cotizaciones, ventas POS, caja,
compras y reportes) con **privilegios dinámicos por módulo y acción validados en el
backend**. Proyecto integrador del equipo **LOBOSOFT** (UTEZ, Desarrollo Web Integral).

**Stack:** monorepo pnpm + Turborepo · Frontend: Next.js + TypeScript + MUI
(microfrontends) · Backend: NestJS + Prisma (microservicios) · PostgreSQL + Redis ·
OpenAPI/Scalar.

| Documento | Para qué |
|---|---|
| [Guía del sistema](docs/GUIA-DEL-SISTEMA.md) | Qué hace cada módulo y quién puede hacer qué |
| [Arquitectura](docs/01-architecture/README.md) | Por qué está hecho así: decisiones, patrones, SOLID, estructura y ramas |
| [Contratos de API](docs/02-api/README.md) | Flujo contrato-primero y OpenAPI por servicio |
| [Despliegue en AWS](docs/DESPLIEGUE-AWS.md) | Publicar el sistema en una instancia, paso a paso |

**Implementación de referencia.** El sistema se publicó en una instancia EC2 con
Docker Compose detrás de nginx como único punto de entrada, con dominio propio y
certificado. El procedimiento completo, reproducible de cero, está en
[docs/DESPLIEGUE-AWS.md](docs/DESPLIEGUE-AWS.md).

---

# Cómo levantar el sistema

Hay dos caminos. Los dos dejan el sistema completo funcionando con datos de
ejemplo; elige según lo que tengas instalado.

| | Camino A · Docker | Camino B · pnpm |
|---|---|---|
| Necesitas | Solo Docker | Node 22+, pnpm 11 y Docker |
| Comandos | 2 | 3 |
| Tarda | 5-15 min (construye imágenes) | 3-5 min |
| Bueno para | Probar que funciona sin instalar nada más | Leer y modificar el código |

---

## Camino A · Un solo comando, solo con Docker

Levanta los siete procesos de backend, la interfaz, PostgreSQL, Redis y nginx.
No depende de la versión de Node que tengas.

```bash
cp .env.example .env
```

Abre el `.env` y pon `EJECUTAR_SEMILLA=true` (solo la primera vez, para que
cargue los datos de ejemplo). Después:

```bash
pnpm prod:build && pnpm prod:up
```

Sin pnpm instalado, el mismo comando directo:

```bash
docker compose -f infra/docker/compose/docker-compose.prod.yml --env-file .env build
docker compose -f infra/docker/compose/docker-compose.prod.yml --env-file .env up -d
```

Cuando termine, el sistema está en **http://localhost** y la API en
**http://localhost/api**. Entra con `admin@scipos.com` / `Admin1234`.

Para apagarlo: `pnpm prod:down`.

---

## Camino B · Con pnpm, para trabajar en el código

### 1. Requisitos

| Herramienta | Versión | Verifica con |
|---|---|---|
| Node | ≥ 22 | `node --version` |
| pnpm | 11 | `pnpm --version` |
| Docker Desktop | reciente | `docker version` |
| Git | reciente | `git --version` |

> **Docker Desktop debe estar abierto** antes de empezar (icono de la ballena activo).
> Si `pnpm` no existe: `corepack enable` y vuelve a abrir la terminal.

### 2. Instalar y preparar

```bash
pnpm install
pnpm setup:local
```

`setup:local` comprueba los requisitos, crea los siete `.env` a partir de sus
`.env.example`, genera el par de llaves RSA con el que se firman los tokens,
levanta PostgreSQL y Redis, aplica las migraciones y siembra los datos de
ejemplo. Si algo falta te lo dice antes de empezar, no a medio camino.

Los valores por defecto ya apuntan a la infraestructura local; no hay que editar
nada. El frontend no necesita `.env`: usa `http://localhost:4000/api`.

El `.env` de productos trae además los dos umbrales con los que el sistema avisa del
inventario al entrar. Si no los defines, usa estos mismos valores:

| Variable | Por defecto | Qué controla |
|---|---|---|
| `UMBRAL_STOCK_BAJO` | `5` | Existencia igual o menor cuenta como stock bajo; en cero, agotado |
| `DIAS_AVISO_CADUCIDAD` | `14` | Días de anticipación del aviso de caducidad. Lo ya vencido se reporta siempre |

Son también los umbrales de las cifras del dashboard, para que el aviso y el
tablero no digan cosas distintas del mismo catálogo.

Los datos de ejemplo que carga: la matriz de privilegios con los cinco usuarios
semilla, el catálogo de productos, los clientes, unas cotizaciones y un turno de
caja con ventas históricas. Si todo salió bien, la última línea dice algo como
`Semilla aplicada: { cajas: 2, ventas: 2, movimientos: 4 }`.

### 3. Levantar las apps

```bash
pnpm dev
```

Y entra en **http://localhost:3001** con `admin@scipos.com` / `Admin1234`.

Si tu máquina va justa de memoria, el mínimo funcional (todo el backend más el
armazón, sin los microfrontends por separado):

```bash
pnpm dev --filter @scipos/seguridad-service --filter @scipos/gateway --filter @scipos/productos-service --filter @scipos/clientes-service --filter @scipos/cotizaciones-service --filter @scipos/ventas-caja-service --filter @scipos/reportes-service --filter @scipos/web-shell
```

### Puertos

| App | URL |
|---|---|
| web-shell (frontend) | http://localhost:3001 |
| API Gateway | http://localhost:4000 |
| Servicio de seguridad | http://localhost:4001 |
| Servicio de productos y compras | http://localhost:4002 |
| Servicio de clientes | http://localhost:4003 |
| Servicio de cotizaciones | http://localhost:4004 |
| Servicio de ventas POS y caja | http://localhost:4005 |
| Servicio de reportes y utilidad | http://localhost:4006 |

### La skill de Alexa no se levanta aquí

El módulo `apps/alexa-skill` no tiene puerto ni proceso local: el código vive en
la consola de Alexa Developer y consume la API a través de internet, así que
necesita una instancia desplegada y alcanzable, no `localhost`. Lo que sí corre
en local son sus pruebas, que no tocan la red:

```bash
pnpm --filter @scipos/alexa-skill test
```

El procedimiento de alta en la consola, las variables de entorno y la lista de
comprobación están en [`apps/alexa-skill/README.md`](apps/alexa-skill/README.md).

---

# Verificar que todo funciona

Sirve para los dos caminos; cambia el puerto según el que hayas usado
(Docker sirve todo por el 80, pnpm usa el 3001 y el 4000).

1. **Salud del backend:** http://localhost:4000/health debe responder `"status": "ok"`
   con la tabla de servicios enrutados. http://localhost:4001/health responde el
   estado del servicio de seguridad.
2. **Documentación de la API:** http://localhost:4001/docs (Scalar).
3. **Frontend:** entra en http://localhost:3001/login con alguna de las cuentas
   semilla de la tabla de abajo. El topbar muestra el usuario y su rol; para ver
   el sistema de privilegios en acción, inicia sesión con roles distintos y
   compara qué módulos y botones aparecen. En DevTools → Network verás las
   llamadas a `localhost:4000/api/seguridad/...` de donde salen esos privilegios.
   Todos los módulos (`/productos`, `/clientes`, `/cotizaciones`, `/pos`,
   `/compras`, `/caja`, `/reportes` y `/usuarios`) y las tarjetas del dashboard
   operan contra la API real. Los únicos datos simulados que quedan son el
   respaldo de `/inicio` y del dashboard cuando su servicio está caído.
   Al entrar aparece, una sola vez por sesión, el aviso de inventario con lo
   vencido o por vencer y lo agotado o por agotarse (si hay algo que avisar).
   Cierra sesión y vuelve a entrar para verlo de nuevo; recargar no lo repite.
   Para probar las pantallas de error, abre una dirección inventada como
   http://localhost:3001/nada (404) o entra con el cajero a
   http://localhost:3001/reportes (403, porque su rol no tiene `reportes:ver`).
4. **La autenticación y el guard en acción** (desde otra terminal):

```bash
# Iniciar sesión: devuelve un access token (RS256), un refresh token y los privilegios
curl -X POST http://localhost:4000/api/seguridad/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"vendedor@scipos.com","contrasena":"Vendedor1234"}'

# 200 con el access token (sustituye <TOKEN> por el del paso anterior)
curl -H "Authorization: Bearer <TOKEN>" http://localhost:4000/api/productos/productos

# 401: sin token (el gateway lo rechaza en el edge y descarta cualquier x-usuario-id externo)
curl -i http://localhost:4000/api/seguridad/roles

# 403: el vendedor no puede eliminar productos aunque fuerce la petición
curl -i -X DELETE -H "Authorization: Bearer <TOKEN>" \
  http://localhost:4000/api/productos/productos/p-001

# Renovar la sesión cuando el access expira (usa el refreshToken del login)
curl -X POST http://localhost:4000/api/seguridad/auth/refresh \
  -H "Content-Type: application/json" -d '{"refreshToken":"<REFRESH>"}'

# Cerrar sesión: revoca el token al instante en todos los servicios (denylist)
curl -X POST -H "Authorization: Bearer <TOKEN>" http://localhost:4000/api/seguridad/auth/logout
```

5. **Pruebas automáticas.** No necesitan base de datos ni contenedores: usan
   dobles de prueba, así que corren en frío.

```bash
pnpm test                                          # todo el monorepo
pnpm --filter @scipos/seguridad-service test       # privilegios efectivos
pnpm --filter @scipos/cotizaciones-service test    # cálculo y conversión a venta
pnpm --filter @scipos/pos-caja-front test          # importes del punto de venta
```

Las de seguridad cubren la regla que sostiene el proyecto: los privilegios
efectivos son los del rol más los concedidos, menos los revocados, y una
revocación individual gana incluso sobre un rol con acceso total. Las del punto
de venta cubren el cálculo de subtotal, descuento y total, incluido que un
descuento mayor al subtotal se recorta en lugar de producir un total negativo, y
que una compra a proveedor no admite descuento.

### Credenciales semilla (una cuenta por rol, más el asistente de voz)

| Correo | Contraseña | Rol |
|---|---|---|
| `admin@scipos.com` | `Admin1234` | ADMINISTRADOR (acceso total) |
| `vendedor@scipos.com` | `Vendedor1234` | VENDEDOR |
| `cajero@scipos.com` | `Cajero1234` | CAJERO |
| `supervisor@scipos.com` | `Supervisor1234` | SUPERVISOR |
| `asistente@scipos.com` | `Asistente1234` | VENDEDOR (usuario de la skill de Alexa) |

El asistente no es una cuenta para personas: es con la que la skill de Alexa
consume la API. Parte del rol Vendedor y termina con **tres privilegios
efectivos** —`productos:ver`, `productos:crear` y `compras:ver`— porque la
semilla le concede los dos que su rol no trae y le revoca los nueve que sí trae
pero que la skill no usa. Es un buen sitio para ver el sistema de privilegios
dinámicos por usuario funcionando de verdad.

Con estas cuentas inicias sesión en `/login`. Desde el primer clic todo el
tráfico viaja con token RS256 (el access se renueva solo con el refresh token
cuando expira); el menú lateral tiene el botón para cerrar sesión.

### Seguridad JWT (RS256 + JWKS)

- El servicio de **seguridad** firma los access tokens con una **llave privada
  RSA** y publica la pública en `http://localhost:4001/.well-known/jwks.json`.
  El gateway y los demás servicios **verifican** con esa llave pública, así que
  nadie más puede emitir tokens (a diferencia de un secreto compartido).
- Las llaves se generan con `pnpm generar:llaves` (las crea `setup:backend`) y
  **no se versionan**. En un despliegue real, genera unas nuevas.
- Access token corto (15 min) + **refresh token rotativo**: reusar un refresh ya
  consumido cierra la sesión (defensa ante robo). El **logout** revoca el token
  al instante vía una denylist en Redis, sin esperar a que expire.

---

# Apagar

```bash
# Camino A (Docker)
pnpm prod:down

# Camino B (pnpm): Ctrl+C en la terminal de pnpm dev, y después
pnpm infra:down
```

---

# Publicar en un servidor

Los dos caminos de arriba son para una máquina propia. Para publicar el sistema
en una instancia (por ejemplo EC2) el procedimiento completo está en
**[docs/DESPLIEGUE-AWS.md](docs/DESPLIEGUE-AWS.md)**.

En resumen: se levanta con Docker Compose detrás de nginx, que queda como único
punto de entrada en el puerto 80. La interfaz y la API comparten origen; los
seis servicios, Postgres y Redis viven en la red interna y no se exponen.

```bash
cp .env.example .env    # único archivo que hay que llenar
pnpm generar:llaves     # par RSA propio de esta instalación
pnpm llaves:entorno     # imprime las llaves listas para pegar en el .env
pnpm prod:build
pnpm prod:up
```

Las contraseñas semilla de la tabla de arriba son públicas por estar en este
documento. En una instancia expuesta a internet defínelas con las variables
`SEED_*_PASSWORD` del `.env` antes del primer arranque.

---

# Problemas comunes

| Síntoma | Causa y solución |
|---|---|
| `docker: error during connect ...` | Docker Desktop no está abierto. Ábrelo y reintenta. |
| `EADDRINUSE :4000/:4001/:3001` | Ya hay algo corriendo en ese puerto (otra terminal con `pnpm dev`). Ciérrala. |
| El frontend muestra acciones pero la API responde 403 | Es el diseño: el frontend cayó a la matriz local porque el backend estaba apagado; levanta seguridad + gateway. |
| `P1001: Can't reach database server` | El contenedor `scipos-db` no está arriba: `pnpm infra:up`. |
| Quiero resetear la base de datos | `docker compose -f infra/docker/compose/docker-compose.dev.yml down -v` y de nuevo `pnpm setup:backend` (el `-v` borra los datos). |
| Redis apagado | El sistema sigue funcionando (solo pierde la caché); revisa `pnpm infra:up` si quieres la caché de privilegios. |
