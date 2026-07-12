# 🐺 LOBOSOFT — Plan de Trabajo Avance 2

## SCIPOS · Frontend Prototipo Simulado

> **Para el equipo:** aquí están tus tareas, cómo nombrar tus ramas y qué poner en tus commits.
> Léelo completo una vez. Si algo no se entiende, pregúntalo en el grupo **antes** de empezar a codear.

**Materia:** Desarrollo Web Integral · **Grupo:** 9°C · **Docente:** Héctor Ulises Stamatio Ferraez
**Metodología:** Shape Up · **Avance:** 2 de 3

---

## 0. TL;DR (resumen de 30 segundos)

- Construimos **el frontend funcional pero simulado**: pantallas ya programadas con **datos falsos (mock)**, **sin backend y sin login** (eso es el Avance 3).
- **Cada quien es dueño de su propia app** (`apps/frontend/<modulo>-front`). Si solo tocas tu carpeta, **casi nunca habrá conflictos al mergear**.
- **`main`** = estable (nadie sube directo). **`develop`** = integración (solo se llega por PR). **`feature/*`** = donde trabajas.
- **Primero Leobardo monta la base** (shell + diseño + dashboard) y la mergea a `develop`. **Recién entonces los demás sacan su rama desde `develop`.**
- Commits estilo **Conventional Commits**: `feat(productos): tabla de catálogo con filtros`.

### Reparto rápido

| Integrante | GitHub | Módulo | Rama principal |
|---|---|---|---|
| **Leobardo Bertadillo** | `LeobardoVillalobos88` | Base del proyecto + Design System + Dashboard | `feature/setup-frontend-base` → `feature/dashboard-inicial` |
| **José Arias** | `20213tn098` | Productos y Servicios | `feature/productos-catalogo` |
| **Jassiel Paredes** | `Jassiel75` | Clientes | `feature/clientes-gestion` |
| **Ángel Aguilar** | `MrAngelovsky` | Cotizaciones + conversión a venta | `feature/cotizaciones-flujo` |
| **Alejandro Torres** | `Aldahir9812` | Ventas POS + Caja | `feature/pos-venta` y `feature/caja-corte` |

---

## 1. ¿Qué entregamos en el Avance 2?

El profesor pide **el frontend funcional pero simulado**: prototipos **ya programados y navegables**, listos para mostrarse, pero **alimentados con datos de mentira (mock)**.

✅ **Sí va en este avance:**
- Pantallas reales en Next.js + TypeScript + MUI, navegables y con interacción.
- Datos simulados (arreglos de objetos en el código), cálculos en el front (totales, subtotales, folios).
- Consistencia visual entre todos los módulos (mismo tema, mismos componentes base).

❌ **NO va en este avance (es para el Avance 3):**
- **Login / autenticación / JWT** → nada de auth todavía.
- Backend real, microservicios, base de datos, llamadas HTTP reales.
- Validación de privilegios en backend.

> 💡 **Detalle que suma puntos:** aunque no hay login, **sí simulamos los privilegios en el front** con un selector de rol de mentira (lo monta Leobardo en el shell). Así cada módulo puede **ocultar o deshabilitar botones** según el rol elegido y demostramos el corazón del proyecto (RF-04/RF-05) sin necesidad de auth real. La validación de verdad llega en el Avance 3.

---

## 2. Reglas de oro (para no romper nada al mergear)

1. **`main` es sagrada.** Nadie hace push directo. Solo recibe código por PR desde `develop` cuando el avance esté listo.
2. **`develop` es la rama de integración.** Tampoco se sube directo: **todo entra por Pull Request**.
3. **Cada quien trabaja en su `feature/*`** y **solo toca su propia carpeta** (`apps/frontend/<tu-modulo>-front`).
4. **No edites la carpeta de otro.** Si necesitas un cambio en el Design System compartido (`apps/frontend/commons`), **pídeselo a Leobardo** o haz un PR pequeñito aparte.
5. **Actualiza tu rama con `develop` seguido** (mínimo una vez al día). Mientras menos tiempo pase tu rama sin actualizarse, menos conflictos al final.
6. **PRs chicos y frecuentes** > un PR gigante al final.
7. **Todo el copy (textos de la UI) en español (es-MX).**
8. **Datos mock, cero llamadas reales** a un servidor.

---

## 3. Arquitectura del frontend (cómo se acomoda el código)

Para este avance **cada módulo es su propia app de Next.js** (microfrontends como aplicaciones separadas, cumpliendo el RNF-05). Se integran de forma sencilla: el **web-shell** es el contenedor con la navegación y enlaza a cada módulo. **La federación en tiempo real (Module Federation) se deja para el Avance 3** para no caer en un *rabbit hole* de configuración.

```
apps/frontend/
├── web-shell/          # (Leobardo) Host: navegación, layout, dashboard, selector de rol mock
├── commons/            # (Leobardo) Design System: tema MUI, componentes base, hooks, mocks compartidos
├── productos-front/    # (José)      Catálogo de productos y servicios
├── clientes-front/     # (Jassiel)   Gestión de clientes
├── cotizaciones-front/ # (Ángel)     Cotizaciones + conversión a venta
└── pos-caja-front/     # (Alejandro) Punto de venta + caja
```

- **`commons` es la fuente de la consistencia visual** (RNF-12): tema, colores, tipografía, botones, tablas, modales, formularios, layout de página. **Todos consumen de ahí** para que las pantallas se vean como un mismo sistema.
- Cada `*-front` corre solo (`pnpm --filter <modulo>-front dev`) y se puede demostrar de forma independiente.
- Ya existe `apps/frontend/example-front` en el repo → Leobardo lo dejará como **plantilla de referencia** para que todos arranquen igual.

---

## 4. Estrategia de ramas (Git del equipo)

```
main  ──────────────────────────────────●  (solo al cerrar el avance, por PR)
                                        ╱
develop ──●──────●──────●──────●───────●   (integración; todo entra por PR)
           ╲      ╲      ╲      ╲
            feature/   feature/  feature/...   (tu trabajo)
```

### Flujo correcto (esto resuelve tu miedo a los conflictos)

1. **Leobardo** crea `develop` desde `main` y sube ahí **la base** (PR #1).
2. **Una vez la base está en `develop`**, los demás sacan su rama **desde `develop`** (NO desde la rama de Leobardo). Así todos parten de una base estable y compartida.
3. Trabajas en tu `feature/*`, haces commits, y cuando tu pedazo funcione → **PR hacia `develop`**.

> ⚠️ **Importante:** no saquen su rama "del dashboard de Leobardo". Espérense a que la base esté **mergeada en `develop`** y ramifiquen desde ahí. Es la diferencia entre integrar sin dolor y pelearse con conflictos.

### Cómo nombrar tu rama

Formato: **`feature/<área>-<descripción-corta-en-kebab>`** (todo en minúsculas, palabras separadas por guion).

| Tipo | Cuándo | Ejemplo |
|---|---|---|
| `feature/...` | Nueva funcionalidad o pantalla | `feature/productos-catalogo` |
| `fix/...` | Corregir un error | `fix/clientes-validacion-correo` |
| `chore/...` | Configuración, mocks, ajustes que no son funcionalidad | `chore/pos-datos-mock` |

### Mantén tu rama al día (hazlo seguido)

```bash
git checkout develop
git pull origin develop          # traes lo último de develop
git checkout feature/tu-rama
git merge develop                # integras develop en tu rama (resuelves conflictos chiquitos aquí)
```

---

## 5. Convención de commits (Conventional Commits)

Formato: **`tipo(alcance): mensaje corto en español, en presente/imperativo`**
El `(alcance)` es opcional pero **recomendado** en monorepo: dice qué módulo tocaste.

> El repo tiene **commitlint** (hook de husky), así que si tu mensaje no respeta el formato, **no te dejará commitear**. Respétalo desde el inicio.

| Tipo | Para qué | Ejemplo |
|---|---|---|
| `feat` | Nueva funcionalidad | `feat(productos): formulario de alta y edición` |
| `fix` | Corrección de bug | `fix(cotizaciones): corrige cálculo de subtotal` |
| `style` | Cambios visuales / formato (sin lógica) | `style(clientes): ajusta espaciado de la tabla` |
| `refactor` | Reordenar código sin cambiar comportamiento | `refactor(pos): extrae componente de carrito` |
| `chore` | Config, mocks, dependencias | `chore(commons): agrega tema base de MUI` |
| `docs` | Documentación | `docs: actualiza README del módulo de caja` |
| `test` | Pruebas | `test(productos): pruebas de la tabla de catálogo` |

**Ejemplos buenos (como los que ya usas):**
- `feat: implementación de vista plantilla oficial`
- `feat(dashboard): tarjetas de resumen con datos simulados`
- `feat(pos): cálculo automático de importes y total`

---

## 6. Fases y orden de trabajo (la continuidad)

### 🔹 Fase 0 — Base (Leobardo, **bloqueante**)
Leobardo monta `web-shell` + `commons` (Design System) + Dashboard + plantilla `*-front` + convención de mocks, y lo mergea a `develop`. **Prioridad: tener una base mínima en `develop` lo antes posible** (días 1–2) para desbloquear al equipo.

**Mientras tanto, los demás NO están parados:** diseñan sus pantallas (boceto/wireframe), definen **qué datos mock** necesitan (campos, ejemplos) y la lista de componentes de su módulo. Así, cuando la base caiga en `develop`, arrancan a toda velocidad.

### 🔹 Fase 1 — Módulos en paralelo (todos)
Cada quien saca su rama desde `develop`, copia la plantilla `*-front` y construye su módulo con datos mock.

### 🔹 Fase 2 — Integración y pulido (todos)
El shell enlaza todos los módulos, se revisa consistencia visual, se prueba la navegación completa y se prepara la demo.

---

## 7. Tareas por integrante

> Cada módulo debe verse y comportarse como prototipo terminado: navegable, con datos mock realistas y usando los componentes del Design System (`commons`).

### 7.1 🏗️ Leobardo Bertadillo — Base + Design System + Dashboard
- **GitHub:** `LeobardoVillalobos88`
- **Ramas:** `feature/setup-frontend-base`, luego `feature/dashboard-inicial`
- **Qué construir:**
  1. **Workspace frontend:** dejar listo el monorepo para que cada `*-front` arranque (pnpm workspace, scripts, plantilla basada en `example-front`).
  2. **`web-shell`:** layout principal (sidebar + topbar), navegación entre módulos, tema MUI, modo de página estándar.
  3. **`commons` (Design System):** tema/colores/tipografía, y componentes base reutilizables: botón, tabla con búsqueda/paginación, modal, inputs de formulario, card, layout de página, badges de estado. **Esto es lo que da consistencia a todo el equipo.**
  4. **Selector de rol mock (simulación de privilegios):** un contexto/hook tipo `usePermisos()` + un selector en el topbar (Administrador / Vendedor / Cajero / Supervisor) que permita a cada módulo **ocultar o deshabilitar acciones**. Documenta cómo se usa.
  5. **Convención de datos mock:** define la carpeta y el patrón (ej. `src/mocks/`) que todos seguirán.
  6. **Dashboard inicial:** tarjetas de resumen (ventas del día, cotizaciones, productos activos, último corte de caja) con datos mock, que **cambien según el rol** seleccionado (RF-32) y oculten utilidades a roles no autorizados (RF-33).
- **RF que cubre:** RF-04, RF-32, RF-33 (y habilita RF-05 en los demás módulos).
- **Criterios de aceptación:** el shell corre, navega entre módulos (aunque sean placeholders al inicio), el tema y los componentes base están publicados en `commons`, el selector de rol funciona y el dashboard responde al rol.

---

### 7.2 📦 José Arias — Productos y Servicios
- **GitHub:** `20213tn098`
- **Rama:** `feature/productos-catalogo`
- **Qué construir:**
  - Tabla/catálogo de productos y servicios con **búsqueda y filtros** (por estado, por tipo producto/servicio).
  - **Alta y edición** (formulario en modal o página) con campos: **nombre, clave, precio, existencia, estado, tipo**.
  - **Desactivar** producto (cambiar estado activo/inactivo, no borrar).
  - Botones de acción (crear/editar/desactivar) **respetando el rol mock** (`usePermisos`).
- **Datos mock:** arreglo de ~15–20 productos/servicios variados.
- **RF que cubre:** RF-07, RF-08, RF-09 (+ RF-05 visual).
- **Criterios de aceptación:** se listan, buscan, filtran, crean, editan y desactivan productos con datos mock; usa los componentes de `commons`.

---

### 7.3 👥 Jassiel Paredes — Clientes
- **GitHub:** `Jassiel75`
- **Rama:** `feature/clientes-gestion`
- **Qué construir:**
  - Lista de clientes con búsqueda.
  - **Alta y edición** de cliente: nombre, RFC (opcional), teléfono, correo, dirección.
  - **Vista de detalle del cliente** con su historial **relacionado** (cotizaciones y ventas) en mock (RF-12).
  - Validaciones básicas de formulario (correo, campos requeridos).
- **Datos mock:** ~10–15 clientes, algunos con cotizaciones/ventas asociadas (coordina los IDs con Ángel y Alejandro para que "embonen").
- **RF que cubre:** RF-10, RF-11, RF-12.
- **Criterios de aceptación:** se listan, buscan, crean y editan clientes; la vista de detalle muestra su historial mock.

---

### 7.4 🧾 Ángel Aguilar — Cotizaciones + conversión a venta
- **GitHub:** `MrAngelovsky`
- **Rama:** `feature/cotizaciones-flujo`
- **Qué construir:**
  - **Crear cotización:** seleccionar cliente (de los mock de Jassiel), agregar productos (de los mock de José), capturar cantidades; el sistema calcula **precio, subtotal y total** y genera un **folio** automático.
  - **Historial de cotizaciones por cliente** (RF-16).
  - **Botón "Convertir a venta"**: arma la venta a partir de la cotización **sin recapturar** los datos (RF-17). Puede mandar al flujo de POS de Alejandro o mostrar la venta generada.
- **Datos mock:** ~8–10 cotizaciones de ejemplo con sus partidas.
- **RF que cubre:** RF-13, RF-14, RF-15, RF-16, RF-17.
- **Criterios de aceptación:** se crea una cotización completa con folio y totales correctos, se ve el historial y la conversión a venta funciona sin recapturar.

---

### 7.5 🛒 Alejandro Torres — Ventas POS + Caja
- **GitHub:** `Aldahir9812`
- **Ramas:** `feature/pos-venta` y `feature/caja-corte` (dos PRs chicos, mejor que uno enorme)
- **Qué construir:**
  - **POS:** pantalla de venta directa, agregar productos al carrito, **cálculo automático de importes y total** (RF-19).
  - **Descuento:** botón visible solo/ habilitado para rol autorizado vía `usePermisos` (RF-20).
  - **Cancelar venta:** acción restringida por rol (RF-21).
  - **Caja:** **apertura** de caja, registro de **ingresos/egresos**, **cierre con corte** (resumen). Apertura/cierre restringidos por rol (RF-26).
- **Datos mock:** productos para vender (alineados con los de José), ventas previas y un corte de caja de ejemplo.
- **RF que cubre:** RF-18 a RF-26 (+ RF-05 visual con privilegios).
- **Criterios de aceptación:** se arma una venta con totales correctos, descuento/cancelación dependen del rol, y caja abre/registra/cierra con corte.

---

## 8. Definition of Done (aplica a todos)

Tu módulo está "terminado" para el Avance 2 cuando:

- [ ] Las pantallas son **navegables** y usan los **componentes de `commons`** (se ven consistentes con el resto).
- [ ] Funciona con **datos mock** (sin llamadas a un servidor).
- [ ] Las acciones sensibles (crear, editar, eliminar, descuento, cancelar, abrir/cerrar caja) **respetan el rol mock** (se ocultan o deshabilitan).
- [ ] Todo el **texto está en español (es-MX)**.
- [ ] **No hay errores** en consola ni warnings de TypeScript; pasa `pnpm lint`.
- [ ] Hiciste **PR a `develop`** con título tipo Conventional Commit y al menos **1 compañero lo revisó**.

---

## 9. Flujo de Pull Request

1. Sube tu rama: `git push -u origin feature/tu-rama`.
2. Abre PR en GitHub **hacia `develop`** (nunca a `main`).
3. Título del PR en estilo commit: `feat(productos): catálogo con alta, edición y filtros`.
4. En la descripción pon: **qué hiciste**, **qué RF cubre** y **cómo probarlo**.
5. Asigna **al menos 1 revisor** del equipo.
6. **No mergees con conflictos** ni con `pnpm lint` en rojo. Resuelve, vuelve a empujar.
7. Merge recomendado: **"Squash and merge"** para mantener limpio el historial de `develop`.

---

## 10. Convención de datos mock (para que todo embone)

- Cada app guarda sus mocks en `src/mocks/` (Leobardo confirma la ruta exacta en la base).
- Usa **tipos de TypeScript** para cada entidad (Producto, Cliente, Cotizacion, Venta…). Si se pueden compartir, van en `commons`.
- **IDs coherentes entre módulos:** los clientes de Jassiel, los productos de José y las cotizaciones/ventas de Ángel y Alejandro deben **referenciarse con los mismos IDs** para que la demo se sienta real (un cliente con sus cotizaciones, una cotización con sus productos, etc.). **Pónganse de acuerdo en el grupo sobre estos IDs.**
- Pensado para que en el Avance 3 sea fácil **cambiar el mock por la llamada real** sin reescribir las pantallas.

---

## 11. Checklist de arranque (para José, Jassiel, Ángel y Alejandro)

> Hazlo **después** de que Leobardo avise que la base ya está en `develop`.

```bash
# 1. Ubícate en develop y trae lo último (ya con la base)
git checkout develop
git pull origin develop

# 2. Crea tu rama desde develop
git checkout -b feature/tu-modulo-descripcion

# 3. Trabaja, commitea con el formato correcto
git add .
git commit -m "feat(tu-modulo): mensaje corto"

# 4. Sube y abre PR hacia develop
git push -u origin feature/tu-modulo-descripcion
```

---

## 12. Anexo — Comandos útiles del monorepo

```bash
pnpm install                          # instala dependencias
pnpm --filter <modulo>-front dev      # corre tu módulo solo
pnpm dev                              # corre todo (vía Turbo)
pnpm lint                             # lint (Biome) — debe pasar antes del PR
```

---

> **Dudas durante el desarrollo:** se resuelven en el grupo. Si tu cambio toca el Design System (`commons`) o la navegación del shell, **coordina con Leobardo** antes de hacerlo. ¡A darle, LOBOSOFT! 🐺
