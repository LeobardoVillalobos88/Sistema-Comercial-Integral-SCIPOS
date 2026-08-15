# 🐺 LOBOSOFT: Plan de Trabajo Avance 3

> **Documento histórico.** Es el plan con el que se construyó el backend y el
> reparto de trabajo del equipo, y se conserva como registro del proceso. Todo
> lo que describe está terminado: los seis servicios, el gateway y la
> autenticación JWT existen y operan.
>
> Para el estado real consulta [`GUIA-DEL-SISTEMA.md`](GUIA-DEL-SISTEMA.md), el
> `README.md` de la raíz y [`DESPLIEGUE-AWS.md`](../DESPLIEGUE-AWS.md).

## SCIPOS · Backend con Microservicios y Privilegios Dinámicos

> **Para el equipo:** aquí están tus tareas, tu servicio, tus ramas y cómo conectar tu módulo del frontend a la API real.
> Léelo completo una vez. Si algo no se entiende, pregúntalo en el grupo **antes** de empezar a codear.

**Materia:** Desarrollo Web Integral · **Grupo:** 9°C · **Docente:** Héctor Ulises Stamatio Ferraez
**Metodología:** Shape Up · **Avance:** 3 de 3

---

## 0. TL;DR (resumen de 30 segundos)

- Construimos **el backend real**: microservicios NestJS + Prisma + PostgreSQL, un API Gateway, y **el sistema de privilegios dinámicos validado en el backend** (lo más calificado del proyecto).
- **Cada quien es dueño de su propio microservicio**, el mismo dominio que ya hizo en el frontend. Al final, **cada quien conecta su módulo del frontend** a su API (adiós mocks).
- **Sin login ni JWT todavía** (no se ha solicitado): la identidad viaja en el header `x-usuario-id` y un guard valida privilegios contra la base de datos. Todo queda diseñado para que, cuando se pida auth, **solo se enchufe el JWT sin tocar servicios ni controladores**.
- **Primero Leobardo monta la base** (workspace backend, commons, gateway, servicio de seguridad, Docker) y la mergea a `develop`. **Recién entonces los demás sacan su rama desde `develop`**, igual que en el Avance 2.
- Commits **Conventional Commits SIN scope**: `feat: servicio de productos con crud y stock`. Nunca `feat(productos): ...` (el hook de commitlint lo rechaza).
- Calendario: **1 semana intensiva, de lunes a jueves**, con el alcance completo planeado por fases y un circuit breaker claro por si algo se atora.

### Reparto rápido

| Integrante | GitHub | Servicio (puerto) | Módulo frontend que conecta | Rama principal |
|---|---|---|---|---|
| **Leobardo Bertadillo** | `LeobardoVillalobos88` | Base backend + `seguridad` (4001) + gateway (4000) | Permisos reales en shell y dashboard | `feature/backend-base` → `feature/seguridad-service` |
| **José Arias** | `20213tn098` | `productos` (4002) con compras e inventario | `productos-front` | `feature/productos-service` |
| **Jassiel Paredes** | `Jassiel75` | `clientes` (4003) | `clientes-front` | `feature/clientes-service` |
| **Ángel Aguilar** | `MrAngelovsky` | `cotizaciones` (4004) | `cotizaciones-front` | `feature/cotizaciones-service` |
| **Alejandro Torres** | `Aldahir9812` | `ventas-caja` (4005) | `pos-caja-front` (POS, caja y compras) | `feature/ventas-caja-service` |

---

## 1. ¿Qué entregamos en el Avance 3?

El backend real del sistema, cumpliendo la base obligatoria del profesor: **microservicios NestJS**, **PostgreSQL**, **API documentada con OpenAPI/Scalar** y, sobre todo, **privilegios dinámicos por módulo y acción validados en el backend** (RF-05, RF-06, RNF-15). El frontend deja los mocks y consume las APIs a través del gateway.

✅ **Sí va en este avance:**
- Microservicios por dominio en `apps/backend/services/` + API Gateway en `apps/backend/gateway/`.
- PostgreSQL en Docker (un contenedor, un schema por servicio) + Redis para cache de privilegios.
- Sistema de privilegios dinámicos en base de datos: usuarios, roles, privilegios `modulo:accion`, asignación por rol y por usuario, y un **guard que bloquea con 403** cualquier acción sin privilegio.
- Contratos OpenAPI primero (`docs/02-api/openapi/`) y documentación viva con Swagger + Scalar en cada servicio (`/docs`).
- Comunicación entre servicios por REST (conversión de cotización a venta, descuento de stock, historial de cliente, compras).
- Frontend conectado: cada módulo reemplaza sus mocks por llamadas reales a la API.

❌ **NO va en este avance (pero queda el enchufe listo):**
- **Login, JWT, refresh tokens**: no se ha solicitado. La identidad se resuelve con el header `x-usuario-id` (ver sección 4). Cuando se pida auth, solo se cambia el extractor de identidad y se agrega el endpoint de login.
- Kafka y eventos (queda documentado como tier avanzado opcional).
- Kubernetes, Jenkins, observabilidad avanzada.
- Timbrado fiscal real (la facturación es simulada por regla del proyecto).

> 💡 **La regla más importante del profesor:** no basta con ocultar botones en el frontend; **el backend debe validar cada acción protegida**. Eso es exactamente lo que construimos aquí: la matriz de privilegios que hoy vive en `apps/frontend/commons/src/permisos/matriz.ts` pasa a la base de datos y **el backend manda**; el frontend solo refleja lo que la API le diga.

---

## 2. Reglas de oro (para no romper nada al mergear)

1. **`main` es sagrada.** Nadie hace push directo. Solo recibe código por PR desde `develop` al cerrar el avance.
2. **`develop` es la rama de integración.** Todo entra por Pull Request con al menos 1 revisor.
3. **Cada quien trabaja en su `feature/*`** y **solo toca su servicio** (`apps/backend/services/<tu-servicio>`) **y su módulo del frontend** (`apps/frontend/<tu-modulo>-front`).
4. **No edites la carpeta de otro.** Si necesitas un cambio en `apps/backend/commons` (guards, cliente HTTP, DTOs compartidos), **pídeselo a Leobardo** o haz un PR pequeñito aparte.
5. **Si tu servicio necesita datos de otro servicio, se piden por REST**, nunca leyendo su schema de base de datos. Cada servicio es dueño exclusivo de sus tablas (RNF-13).
6. **Contrato primero:** antes de codear un endpoint, escribe o actualiza tu YAML en `docs/02-api/openapi/services/`. El contrato es lo que los demás usan para integrarse contigo sin esperarte.
7. **Todo endpoint sensible lleva guard de privilegios.** Si un botón del frontend está detrás de `can("x:y")`, su endpoint debe estar detrás de `@RequierePrivilegio("x:y")`. Sin excepciones.
8. **pnpm siempre** (nunca npm), lint con **Biome** (no copies configs de ESLint/Prettier de otros proyectos), copy y código en **español (es-MX)**.
9. **Actualiza tu rama con `develop` mínimo una vez al día.** PRs chicos y frecuentes.
10. **Los seeds usan los mismos IDs que los mocks del frontend**, para que la demo embone igual que en el Avance 2.

---

## 3. Arquitectura del backend (cómo se acomoda el código)

Seguimos la estructura del **SetUp General** del profesor. El backend vive en `apps/backend/` y entra al workspace de pnpm en este avance:

```
apps/backend/
├── gateway/                  # (Leobardo) API Gateway NestJS: enruta /api/<servicio>/* a cada puerto
├── commons/                  # (Leobardo) Lib compartida SOLO backend
│   ├── contracts/            #   DTOs y tipos compartidos entre servicios
│   ├── security/             #   Guard de privilegios, decorador, extractor de identidad
│   ├── observability/        #   Logger y utilidades de trazas
│   └── utils/                #   Respuesta estándar, filtro global de errores, cliente HTTP
├── services/
│   ├── seguridad/            # (Leobardo)  usuarios, roles, privilegios dinámicos
│   ├── productos/            # (José)      catálogo, inventario, stock y compras
│   ├── clientes/             # (Jassiel)   clientes e historial relacionado
│   ├── cotizaciones/         # (Ángel)     cotizaciones, folios y conversión a venta
│   └── ventas-caja/          # (Alejandro) ventas POS, descuentos, cancelaciones y caja
└── test/                     # pruebas de integración backend (colecciones y scripts)
```

Cada servicio sigue **el estilo que enseñó el profesor** en sus microservicios de práctica: NestJS 11 + Prisma (adapter pg) + `class-validator` + Swagger con **Scalar** en `/docs` (OpenAPI JSON en `/api-json`) + módulo Redis con ioredis + `HealthController` en `/health`. Leobardo deja una **plantilla de servicio** con todo esto armado para que todos arranquen idéntico.

### Puertos y schemas

El frontend ya ocupa 3001 a 3006, así que el backend usa la serie 4000:

| App | Puerto | Schema en Postgres | Dueño |
|---|---|---|---|
| gateway | 4000 | (sin base de datos) | Leobardo |
| seguridad | 4001 | `seguridad` | Leobardo |
| productos | 4002 | `productos` | José |
| clientes | 4003 | `clientes` | Jassiel |
| cotizaciones | 4004 | `cotizaciones` | Ángel |
| ventas-caja | 4005 | `ventas_caja` | Alejandro |

- **Una sola base** `scipos` en un contenedor Postgres 16 (credenciales del SetUp General: `root`/`root`), y **cada servicio usa su propio schema** vía connection string, por ejemplo:
  `DATABASE_URL=postgresql://root:root@localhost:5432/scipos?schema=productos`
- **Redis 5** con contraseña `root` para cache (principalmente privilegios por usuario).
- El frontend **solo habla con el gateway**: `NEXT_PUBLIC_API_URL=http://localhost:4000/api`. El gateway enruta `/api/seguridad/*` → 4001, `/api/productos/*` → 4002, etc., maneja CORS para los puertos 3001 a 3006 y reenvía el header `x-usuario-id`.

### Flujo de datos

```
Frontend (web-shell + microfrontends, 3001-3006)
        ↓  fetch con header x-usuario-id
API Gateway (4000)
        ↓  proxy por servicio
Microservicios NestJS (4001-4005)  ←──REST entre servicios──→
        ↓
PostgreSQL (schema por servicio) + Redis (cache de privilegios)
```

### Comunicación y errores entre servicios (RNF-14)

- Entre servicios se usa el **cliente HTTP de `commons/utils`** (timeout corto, reintento simple y mapeo de errores a excepciones Nest). Nada de URLs quemadas: van en variables de entorno.
- Si un servicio consultado no responde, el que consulta **degrada con gracia**: por ejemplo, el historial de un cliente regresa lo que sí pudo juntar y marca qué fuente falló, en lugar de tirar todo el request.
- Las operaciones que cruzan servicios (convertir cotización, vender con stock) se hacen en **pasos secuenciales con verificación**: primero se valida, luego se ejecuta, y solo se confirma el estado final si el paso remoto tuvo éxito.

---

## 4. El corazón del proyecto: privilegios dinámicos validados en backend

Esto es **lo que más califica el profesor**. El diseño completo:

### 4.1 Modelo de datos (servicio `seguridad`)

```
usuarios            (id, nombre, correo, rolId, estado)
roles               (id, clave)                          → ADMINISTRADOR, VENDEDOR, CAJERO, SUPERVISOR
privilegios         (id, clave)                          → "productos:crear", "pos:descuento", "caja:cerrar", ...
roles_privilegios   (rolId, privilegioId)                → lo que cada rol tiene por defecto
usuarios_privilegios(usuarioId, privilegioId, concedido) → ajustes por usuario: concede o revoca sobre lo del rol
```

- El **seed** carga la matriz actual de `apps/frontend/commons/src/permisos/matriz.ts` tal cual (mismos strings `modulo:accion`) y crea **4 usuarios semilla, uno por rol**, con IDs conocidos por todo el equipo.
- Los privilegios efectivos de un usuario = privilegios de su rol + concesiones por usuario − revocaciones por usuario. Eso cumple RF-03: **asignar privilegios específicos por módulo y acción a cada usuario**, no solo por rol.
- Endpoints clave: `GET /usuarios/:id/privilegios` (lista efectiva), `POST/DELETE` para asignar o revocar privilegios a un rol o a un usuario, y `GET /privilegios/verificar?usuarioId=...&privilegio=...`.
- **Cache en Redis** de la lista efectiva por usuario, invalidada al cambiar cualquier asignación.

### 4.2 El guard (en `apps/backend/commons/security`)

Todos los servicios protegen sus endpoints igual:

```ts
@Post()
@RequierePrivilegio("productos:crear")
crear(@Body() dto: CrearProductoDto) { ... }
```

El `GuardPrivilegios` hace tres cosas:
1. Obtiene la identidad del request con un **`ExtractorIdentidad`** (interfaz). La implementación actual es `ExtractorHeader`: lee `x-usuario-id`. Sin header → **401**.
2. Consulta los privilegios efectivos del usuario al servicio `seguridad` (con cache Redis).
3. Si el privilegio requerido no está en la lista → **403** con mensaje claro.

### 4.3 Listo para el JWT (sin implementarlo hoy)

Cuando el profesor pida autenticación, el plan ya está pavimentado y **nada de lo construido se tira**:
1. Se implementa `ExtractorJwt` (misma interfaz `ExtractorIdentidad`): saca el `usuarioId` del token en lugar del header.
2. El servicio `seguridad` agrega el endpoint de login que emite el JWT (los usuarios ya existen en su tabla).
3. El gateway valida el token y propaga la identidad a los servicios.
4. Controladores, guards, decoradores y servicios de dominio **no cambian ni una línea**.

### 4.4 El frontend deja de mandar

- `PermisosProvider` deja la matriz local y ahora **descarga los privilegios reales** con `GET /api/seguridad/usuarios/:id/privilegios`.
- El selector de rol del topbar pasa a ser un **selector de usuario semilla** (uno por rol): al cambiarlo, se recargan los privilegios y todos los `can("x:y")` y `<Permiso>` existentes reaccionan solos, sin tocar los módulos.
- El cliente HTTP del frontend (en `apps/frontend/commons`) agrega el header `x-usuario-id` del usuario activo a toda petición.
- Los menús del sidebar ya son dinámicos por privilegio (RF-04); ahora lo serán con datos del backend.
- **Demo estrella:** revocarle un privilegio a un usuario desde la API y ver cómo el botón desaparece del frontend y, aunque se forzara la petición, el backend responde 403.

### 4.5 SOLID aplicado (justificación para la entrega)

| Principio | Dónde se aplica |
|---|---|
| **S** (responsabilidad única) | Un servicio por dominio con sus propias tablas; controladores delgados, lógica en services. |
| **O** (abierto/cerrado) | Nuevos privilegios se agregan como datos (filas en BD), sin modificar el guard ni los controladores. |
| **L** (sustitución de Liskov) | `ExtractorHeader` y el futuro `ExtractorJwt` son intercambiables detrás de `ExtractorIdentidad`. |
| **I** (segregación de interfaces) | DTOs de entrada y salida separados por operación en `contracts`; nadie depende de campos que no usa. |
| **D** (inversión de dependencias) | El guard y los services dependen de abstracciones (extractor, cliente HTTP), inyectadas por Nest. |

---

## 5. Estrategia de ramas (Git del equipo)

```
main  ──────────────────────────────────●  (solo al cerrar el avance, por PR)
                                        ╱
develop ──●──────●──────●──────●───────●   (integración; todo entra por PR)
           ╲      ╲      ╲      ╲
            feature/   feature/  feature/...   (tu trabajo)
```

1. **Leobardo** sube la base del backend a `develop` (PR de `feature/backend-base`).
2. **Una vez la base está en `develop`**, los demás sacan su rama **desde `develop`** (no desde la rama de Leobardo).
3. Trabajas en tu `feature/*`, y cuando tu pedazo funcione → **PR hacia `develop`**.

| Tipo | Cuándo | Ejemplo |
|---|---|---|
| `feature/...` | Nueva funcionalidad | `feature/productos-service`, `feature/clientes-conexion-api` |
| `fix/...` | Corregir un error | `fix/cotizaciones-calculo-total` |
| `chore/...` | Config, seeds, ajustes sin funcionalidad | `chore/seeds-productos` |

Sugerencia de ramas por persona: una para el **servicio** (`feature/<dominio>-service`) y otra para la **conexión del frontend** (`feature/<dominio>-conexion-api`). Dos PRs chicos integran mejor que uno gigante.

### Mantén tu rama al día (hazlo diario)

```bash
git checkout develop
git pull origin develop
git checkout feature/tu-rama
git merge develop
```

---

## 6. Convención de commits (¡ojo, cambió desde el Avance 2!)

Formato: **`tipo: mensaje corto en español, en presente`**. **SIN scope, sin paréntesis.** El hook de commitlint **rechaza** `tipo(scope): ...`.

| ✅ Correcto | ❌ Incorrecto |
|---|---|
| `feat: servicio de productos con crud y stock` | `feat(productos): crud y stock` |
| `feat: guard de privilegios con header de usuario` | `feat(commons): guard de privilegios` |
| `fix: corrige calculo del corte de caja` | `fix(caja): corrige calculo del corte` |
| `docs: contrato openapi del servicio de clientes` | `docs(api): contrato de clientes` |

Tipos permitidos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`. El hook `pre-commit` corre `pnpm lint`; si Biome está en rojo, no hay commit.

---

## 7. Fases y calendario (1 semana intensiva, lunes a jueves)

El alcance está planeado completo (como un ciclo normal de 4 semanas) pero comprimido en 4 días de trabajo enfocado. La continuidad es la misma fórmula que nos funcionó en el Avance 2: base bloqueante primero, dominios en paralelo después.

### 🔹 Lunes · Fase 0: Base del backend (Leobardo, **bloqueante**)

Leobardo monta y mergea a `develop`: workspace + Docker + `commons` backend + gateway + servicio `seguridad` con el guard funcionando + plantilla de servicio. **Prioridad absoluta: que la base caiga en `develop` el mismo lunes.**

**Mientras tanto, los demás NO están parados:**
- Escriben su **contrato OpenAPI** en `docs/02-api/openapi/services/<servicio>.yaml` (endpoints, DTOs, códigos de error, qué privilegio protege cada operación). El contrato no depende de código, se puede commitear desde ya.
- Diseñan su **schema de Prisma** (tablas, relaciones, enums) en papel o en el mismo PR del contrato.
- Preparan sus **seeds**: qué mocks del frontend van a convertir en datos semilla (mismos IDs).

### 🔹 Martes · Fase 1: Servicios en paralelo (todos)

Cada quien copia la plantilla de servicio, implementa su CRUD con Prisma, protege **todos** los endpoints con `@RequierePrivilegio`, carga sus seeds y verifica su Scalar en `/docs`. Al final del día, el gateway enruta los 5 servicios y cualquiera del equipo puede pegarle a tu API con los usuarios semilla.

### 🔹 Miércoles · Fase 2: Flujos entre servicios + inicio de conexión frontend

Los flujos que cruzan dominios (aquí es donde el sistema se siente integral):
- **Ángel ↔ Alejandro:** convertir cotización crea una venta real.
- **Alejandro ↔ José:** vender descuenta stock; comprar lo incrementa.
- **Jassiel ↔ Ángel/Alejandro:** historial del cliente junta cotizaciones y ventas reales.
- **Todos ↔ Leobardo:** el guard consulta privilegios reales de `seguridad`.

En paralelo, cada quien empieza a conectar su módulo del frontend (reemplazar mocks por el cliente API).

### 🔹 Jueves · Fase 3: Conexión total, privilegios end-to-end y pulido

- Frontend 100% conectado: `PermisosProvider` con privilegios reales, módulos sin mocks, `SkeletonTabla` mientras carga, toasts de error.
- Reportes básicos para el dashboard (cada servicio expone su endpoint de resumen y el dashboard de Leobardo los consume).
- Prueba cruzada en equipo: cada quien prueba el módulo de otro con los 4 usuarios semilla buscando accesos que no deberían pasar.
- Extras solo si el núcleo ya quedó: comprobante PDF simulado de la venta y pantalla de administración de privilegios.

### Circuit breaker (Shape Up)

Si el tiempo aprieta, se recorta **en este orden** (de lo más prescindible a lo intocable):

1. Pantalla de administración de privilegios (la asignación se demuestra por API/Scalar).
2. Comprobante PDF simulado.
3. Reportes del dashboard (se queda con datos resumidos mínimos).
4. Módulo de compras (queda el contrato y el endpoint de stock listo).
5. Movimientos avanzados de caja (se conserva abrir, vender y corte).

**Núcleo intocable:** seguridad + privilegios dinámicos validados en backend, productos, clientes, cotizaciones y conversión de cotización a venta. Eso no se recorta por ningún motivo.

**Rabbit holes detectados** (si te topas uno, avisa en el grupo antes de hundirte): consistencia entre servicios al convertir cotización (resuélvelo con pasos secuenciales verificados, no inventes transacciones distribuidas), configuración de Prisma con multischema (usa `?schema=` en la URL y ya), CORS entre 6 apps y el gateway (queda resuelto en la base), y el cache de Redis (si estorba, se apaga y se consulta directo a BD).

**No-gos:** login/JWT (solo queda el enchufe), Kafka, Kubernetes, Jenkins, timbrado fiscal real, app móvil.

---

## 8. Tareas por integrante

> Todo servicio debe seguir la plantilla común (ValidationPipe, Swagger + Scalar, health, Prisma, Redis), proteger **cada endpoint sensible** con `@RequierePrivilegio` y traer seeds con los IDs de los mocks del frontend.

### 8.1 🏗️ Leobardo Bertadillo: Base backend + Seguridad + Gateway

- **GitHub:** `LeobardoVillalobos88`
- **Ramas:** `feature/backend-base`, luego `feature/seguridad-service`, luego `feature/permisos-conexion-api`
- **Qué construir:**
  1. **Workspace backend:** agregar `apps/backend/*` y `apps/backend/services/*` a `pnpm-workspace.yaml`, tareas de turbo, `tsconfig` base del backend y estructura de carpetas del SetUp General.
  2. **Infra local:** `infra/docker/compose/docker-compose.dev.yml` con `scipos-db` (Postgres 16, `root`/`root`, base `scipos`, puerto 5432) y `scipos-redis` (Redis 5 con contraseña `root`, puerto 6379), más scripts de up/down/reset.
  3. **`apps/backend/commons`:** decorador `@RequierePrivilegio`, `GuardPrivilegios`, interfaz `ExtractorIdentidad` + `ExtractorHeader` (`x-usuario-id`), cliente HTTP entre servicios (timeouts y mapeo de errores), filtro global de excepciones y formato de respuesta estándar.
  4. **Servicio `seguridad` (4001):** modelo de datos de la sección 4.1, seed con la matriz del frontend + 4 usuarios semilla, endpoints de usuarios y de asignación/revocación de privilegios por rol y por usuario, verificación de privilegios y cache Redis con invalidación.
  5. **Gateway (4000):** proxy `/api/<servicio>/*` a cada puerto, CORS para 3001-3006, reenvío de `x-usuario-id`.
  6. **Plantilla de servicio** para el equipo (estilo de los microservicios del profesor) y contrato OpenAPI de `seguridad` como ejemplo a seguir.
  7. **Frontend:** cliente API en `apps/frontend/commons` (base URL del gateway + header `x-usuario-id`), `PermisosProvider` consumiendo privilegios reales y selector de usuario semilla en el topbar. Al final: dashboard e inicio consumiendo los endpoints de resumen de los demás.
- **RF que cubre:** RF-02, RF-03, RF-04 (base de RF-05 y RF-06 para todos), RF-32, RF-33.
- **Criterios de aceptación:** `docker compose` levanta Postgres y Redis; `seguridad` corre en 4001 con Scalar en `/docs`; sin header responde 401 y sin privilegio 403; la matriz en BD es idéntica a la del frontend; el gateway enruta los 5 servicios; el frontend muestra y oculta acciones según los privilegios que responde la API.

---

### 8.2 📦 José Arias: Servicio de productos, inventario y compras

- **GitHub:** `20213tn098`
- **Ramas:** `feature/productos-service`, luego `feature/productos-conexion-api`
- **Qué construir:**
  - **Contrato primero:** `docs/02-api/openapi/services/productos.yaml`.
  - **Prisma (schema `productos`):** producto con nombre, clave, tipo (producto/servicio), lote, fecha de caducidad opcional, **precioCompra y precioVenta** (no hay precio único), existencia y estado; compra con sus partidas (RF-34, RF-35).
  - **Endpoints:** CRUD de productos con búsqueda y filtros por estado y tipo (RF-07, RF-08, RF-09); activar/desactivar (soft delete); eliminar definitivo solo con `productos:eliminar`; **ajuste de stock** `POST /productos/:id/stock` con delta y motivo (VENTA, COMPRA, AJUSTE) para que ventas-caja lo consuma; `POST /compras` que registra la compra e **incrementa existencias en una transacción** (RF-36).
  - **Seed:** `PRODUCTOS_MOCK` con los mismos IDs.
  - **Resumen para dashboard:** productos activos, stock bajo y próximos a caducar.
  - **Conectar `productos-front`:** reemplazar mocks por la API vía gateway, `SkeletonTabla` al cargar, toasts en errores.
- **RF que cubre:** RF-07, RF-08, RF-09, RF-34, RF-35, RF-36 (+ RF-05/RF-06 en sus endpoints).
- **Criterios de aceptación:** el catálogo del frontend opera contra la API real; crear/editar/desactivar/eliminar respetan privilegios (403 comprobado con usuario sin permiso); una venta descuenta stock y una compra lo incrementa de forma consistente.

---

### 8.3 👥 Jassiel Paredes: Servicio de clientes

- **GitHub:** `Jassiel75`
- **Ramas:** `feature/clientes-service`, luego `feature/clientes-conexion-api`
- **Qué construir:**
  - **Contrato primero:** `docs/02-api/openapi/services/clientes.yaml`.
  - **Prisma (schema `clientes`):** nombre, RFC opcional, teléfono (10 dígitos validados con `class-validator`), correo, dirección, estado.
  - **Endpoints:** CRUD con búsqueda (RF-10, RF-11); activar/desactivar; eliminar definitivo solo con `clientes:eliminar`; **`GET /clientes/:id/historial`** que consulta por REST las cotizaciones (servicio de Ángel) y las ventas (servicio de Alejandro) del cliente y las junta (RF-12). Si una fuente falla, regresa historial parcial indicando qué fuente no respondió.
  - **Seed:** `CLIENTES_MOCK` con los mismos IDs.
  - **Resumen para dashboard:** clientes activos y clientes nuevos.
  - **Conectar `clientes-front`:** lista, formularios y el diálogo de detalle con historial real en sus tabs.
- **RF que cubre:** RF-10, RF-11, RF-12 (+ RF-05/RF-06 en sus endpoints).
- **Criterios de aceptación:** CRUD completo desde el frontend real con validaciones del backend; el detalle muestra cotizaciones y ventas reales del cliente; privilegios validados en backend (403 comprobado).

---

### 8.4 🧾 Ángel Aguilar: Servicio de cotizaciones y conversión a venta

- **GitHub:** `MrAngelovsky`
- **Ramas:** `feature/cotizaciones-service`, luego `feature/cotizaciones-conexion-api`
- **Qué construir:**
  - **Contrato primero:** `docs/02-api/openapi/services/cotizaciones.yaml`.
  - **Prisma (schema `cotizaciones`):** cotización con **folio automático consecutivo** (RF-14), cliente, partidas (producto, cantidad, precio), subtotal, IVA, total y estado **BORRADOR → ENVIADA → VENDIDA**.
  - **Endpoints:** crear cotización validando por REST que el cliente y los productos existan, con **totales calculados en el servidor** (RF-13, RF-15); listar y filtrar; historial por cliente (RF-16); marcar como enviada con `cotizaciones:enviar`; eliminar con `cotizaciones:eliminar`; **`POST /cotizaciones/:id/convertir`** con `cotizaciones:convertir`: llama al servicio de ventas-caja para crear la venta con las partidas de la cotización y **solo si la venta se creó** marca la cotización como VENDIDA (RF-17).
  - **Seed:** `COTIZACIONES_MOCK` con los mismos IDs y folios.
  - **Resumen para dashboard:** cotizaciones por estado del periodo.
  - **Conectar `cotizaciones-front`:** listado, creación, ciclo de vida y conversión contra la API real.
- **RF que cubre:** RF-13, RF-14, RF-15, RF-16, RF-17 (+ RF-05/RF-06 en sus endpoints).
- **Criterios de aceptación:** folios consecutivos sin repetirse; totales correctos calculados en backend; convertir genera una venta real sin recapturar datos y el estado solo cambia si la venta existe; privilegios validados (403 comprobado).

---

### 8.5 🛒 Alejandro Torres: Servicio de ventas POS y caja

- **GitHub:** `Aldahir9812`
- **Ramas:** `feature/ventas-caja-service`, luego `feature/pos-caja-conexion-api`
- **Qué construir:**
  - **Contrato primero:** `docs/02-api/openapi/services/ventas-caja.yaml`.
  - **Prisma (schema `ventas_caja`):** venta con partidas (a precioVenta), descuento, IVA y total; caja con apertura, cierre y monto inicial; movimientos de ingreso/egreso ligados a la caja.
  - **Endpoints de ventas:** `POST /ventas` exige **caja abierta**, calcula importes y total en el servidor (RF-18, RF-19), aplica descuento **solo** con `pos:descuento` (RF-20) y **descuenta stock** llamando al servicio de productos; cancelar venta solo con `pos:cancelar` y **repone el stock** (RF-21); consulta de ventas con filtro por cliente, para el historial de Jassiel (RF-22). Endpoint para crear venta **desde cotización** (lo consume Ángel al convertir).
  - **Endpoints de caja:** abrir con `caja:abrir` (RF-23), registrar ingresos/egresos con `caja:movimiento` (RF-24), corte con `caja:cerrar` que resume ventas y movimientos del turno (RF-25, RF-26).
  - **Compras en el frontend:** el modo compra de `PosCajaPage` (ruta `/compras`) se conecta al `POST /compras` del servicio de José (la compra no exige caja abierta, igual que hoy).
  - **Seed:** ventas previas y un corte de ejemplo coherentes con los mocks actuales.
  - **Resumen para dashboard:** ventas del día y estado de la caja.
  - **Conectar `pos-caja-front`:** POS, caja y compras completos contra API real.
- **RF que cubre:** RF-18 a RF-26 (+ RF-05/RF-06 en sus endpoints).
- **Criterios de aceptación:** no se puede vender con caja cerrada; descuento y cancelación regresan 403 para usuarios sin privilegio aunque se fuerce la petición; el stock baja al vender, se repone al cancelar y sube al comprar; el corte cuadra con las ventas y movimientos del turno.

---

## 9. Definition of Done (aplica a todos)

Tu parte está "terminada" para el Avance 3 cuando:

- [ ] Tu **contrato OpenAPI** está en `docs/02-api/openapi/services/<servicio>.yaml` y coincide con lo implementado.
- [ ] Tu servicio corre con `pnpm --filter @scipos/<servicio>-service dev`, responde en `/health` y su **Scalar en `/docs`** documenta todos los endpoints.
- [ ] **Todos los endpoints sensibles** están detrás de `@RequierePrivilegio`: sin header responde **401**, sin privilegio responde **403** (probado con los 4 usuarios semilla).
- [ ] Tus **seeds** son reproducibles y usan los IDs de los mocks del frontend.
- [ ] Tu **módulo del frontend quedó conectado**: cero mocks en el flujo principal, `SkeletonTabla` al cargar y toasts en errores.
- [ ] `pnpm lint` y el typecheck de tus paquetes pasan en verde.
- [ ] Hiciste **PR a `develop`** con título estilo commit (sin scope) y al menos **1 compañero lo revisó**.

---

## 10. Flujo de Pull Request

1. Sube tu rama: `git push -u origin feature/tu-rama`.
2. Abre PR en GitHub **hacia `develop`** asignando a **Leobardo** para que lo revice y mergee a develop (nunca a `main`).
3. Título estilo commit **sin scope**: `feat: servicio de clientes con historial`.
4. En la descripción: **qué hiciste**, **qué RF cubre**, **cómo probarlo** (incluye ejemplos de request con `x-usuario-id` y qué usuario semilla usar).
5. Asigna a **Leobardo** como revisor. El revisor prueba al menos un endpoint con un usuario **sin** privilegio y verifica el 403.
6. **No mergees con conflictos** ni con `pnpm lint` en rojo.
7. Merge recomendado: **"Squash and merge"**.

---

## 11. Checklist de arranque (para José, Jassiel, Ángel y Alejandro)

> Hazlo **después** de que Leobardo avise que la base ya está en `develop`.

```bash
# 1. Trae lo último de develop (ya con la base del backend)
git checkout develop
git pull origin develop

# 2. Levanta la infraestructura local
docker compose -f infra/docker/compose/docker-compose.dev.yml up -d

# 3. Instala dependencias del monorepo
pnpm install

# 4. Crea tu rama desde develop
git checkout -b feature/tu-servicio

# 5. Copia la plantilla de servicio, renombra el paquete a @scipos/<dominio>-service
#    y configura tu .env (puerto y schema propios):
#    PORT=400X
#    DATABASE_URL=postgresql://root:root@localhost:5432/scipos?schema=<tu_schema>
#    REDIS_URL=redis://:root@localhost:6379

# 6. Genera cliente, migra y siembra tu schema
pnpm --filter @scipos/<dominio>-service prisma:generate
pnpm --filter @scipos/<dominio>-service prisma:migrate
pnpm --filter @scipos/<dominio>-service seed

# 7. Corre tu servicio y revisa /health y /docs
pnpm --filter @scipos/<dominio>-service dev

# 8. Commitea con el formato correcto (SIN scope) y abre PR a develop
git commit -m "feat: servicio de <dominio> con crud"
git push -u origin feature/tu-servicio
```

---

## 12. Anexo: Comandos útiles

```bash
# Infraestructura
docker compose -f infra/docker/compose/docker-compose.dev.yml up -d    # levanta Postgres + Redis
docker compose -f infra/docker/compose/docker-compose.dev.yml down     # apaga todo

# Monorepo
pnpm install                                   # instala todo el workspace
pnpm dev                                       # todo (frontend + backend) vía Turbo
pnpm --filter @scipos/gateway dev              # solo el gateway       → http://localhost:4000
pnpm --filter @scipos/seguridad-service dev    # solo seguridad        → http://localhost:4001
pnpm --filter @scipos/web-shell dev            # el frontend host      → http://localhost:3001
pnpm lint                                      # Biome en todo el repo (debe pasar antes del PR)

# Probar un endpoint protegido a través del gateway
curl http://localhost:4000/api/productos \
  -H "x-usuario-id: <id-usuario-semilla>"      # sin el header: 401; sin privilegio: 403
```

---

> **Dudas durante el desarrollo:** se resuelven en el grupo. Si tu cambio toca `apps/backend/commons`, el gateway o el servicio de seguridad, **coordina con Leobardo** antes de hacerlo. Si tu flujo cruza con el servicio de otro (stock, conversión, historial), **pónganse de acuerdo en el contrato antes de codear**. ¡A cerrar el proyecto, LOBOSOFT! 🐺
