# Estructura del repositorio

Qué hay en cada carpeta y por qué está donde está. Todo lo que aparece aquí
existe y se usa; el repositorio no tiene carpetas reservadas para el futuro.

---

## El árbol

```
scipos/
├─ apps/
│  ├─ frontend/
│  │  ├─ web-shell/            armazón: rutas, menú, sesión (puerto 3001)
│  │  ├─ commons/              sistema de diseño, permisos, cliente de API
│  │  ├─ login-front/          pantalla de acceso (componente, sin puerto)
│  │  ├─ productos-front/      catálogo, lotes, alertas          (3003)
│  │  ├─ clientes-front/       clientes e historial              (3004)
│  │  ├─ cotizaciones-front/   cotizaciones y su ciclo           (3005)
│  │  ├─ pos-caja-front/       punto de venta, compra y caja     (3006)
│  │  └─ reportes-front/       los cinco reportes                (3007)
│  ├─ backend/
│  │  ├─ gateway/              única entrada HTTP                (4000)
│  │  ├─ commons/              guard de privilegios, cliente HTTP, contratos
│  │  └─ services/
│  │     ├─ seguridad/         identidad, tokens y privilegios   (4001)
│  │     ├─ productos/         catálogo, inventario y compras    (4002)
│  │     ├─ clientes/          clientes e historial distribuido  (4003)
│  │     ├─ cotizaciones/      cotizaciones y conversión a venta (4004)
│  │     ├─ ventas-caja/       POS, caja y comprobante PDF       (4005)
│  │     └─ reportes/          agregador, sin base de datos      (4006)
│  └─ alexa-skill/             asistente de voz del almacén (sin puerto)
├─ docs/
│  ├─ 01-architecture/         por qué está hecho así (esta carpeta)
│  ├─ 02-api/openapi/          los seis contratos, uno por servicio
│  ├─ readmes/                 guía funcional y planes de trabajo
│  └─ pdfs/                    el enunciado y la rúbrica
├─ infra/
│  ├─ docker/
│  │  ├─ Dockerfile.backend    una imagen para los siete procesos
│  │  ├─ Dockerfile.web        el armazón
│  │  ├─ entrypoint-backend.sh migraciones y semilla al arrancar
│  │  └─ compose/              desarrollo, producción y la capa de TLS
│  └─ nginx/                   proxy inverso: con y sin certificado
├─ scripts/                    generación de llaves RSA
├─ .github/workflows/          integración continua
├─ CLAUDE.md                   arquitectura obligatoria y convenciones
├─ DESIGN.md                   el mundo visual y sus tokens
├─ PRODUCT.md                  qué es el producto y para quién
└─ README.md                   arranque local, paso a paso
```

---

## Las decisiones que explican el árbol

### `commons` está partido en dos y nunca se cruzan

`apps/frontend/commons` y `apps/backend/commons` son bibliotecas distintas y
deliberadamente incomunicadas. No es duplicación: **compilan diferente**.

| | Frontend | Backend |
|---|---|---|
| Qué es | solo fuentes | compilado con `tsc` |
| Cómo se consume | `transpilePackages` de Next | `dist/` |
| Qué exporta | tema, componentes, permisos, cliente de API | guard, cliente HTTP, contratos |

Una biblioteca común a las dos tendría que satisfacer ambos mundos y acabaría
arrastrando React al backend o Nest al navegador.

### Los servicios se nombran por dominio, no por capa

No hay `crud-service` ni `data-service`. Cada servicio es dueño de un dominio y
de su esquema de PostgreSQL, y ninguno lee el esquema de otro: lo cruzado va por
REST. Por eso `compras` vive dentro de `productos` —una compra existe para mover
existencias— y `pos` y `caja` son un solo servicio: una venta no se registra sin
turno abierto.

### `reportes` no tiene carpeta `prisma/`

Y no es un olvido. Es un agregador: pide por REST a los otros cuatro y arma la
respuesta. Si tuviera tablas propias, tendría que mantenerlas sincronizadas con
los servicios de los que copia.

### La numeración de `docs/`

`01-architecture` y `02-api` siguen el orden en que alguien nuevo los necesita:
primero entender por qué está hecho así, después el contrato de cada servicio. El
prefijo numérico existe para que el orden alfabético del sistema de archivos
coincida con ese orden de lectura.

---

## Lo que **no** existe, y por qué

Igual de importante. Estas carpetas aparecen en el andamiaje que sugiere el
enunciado y **se decidió no crearlas**, en vez de dejarlas vacías: una carpeta
vacía promete algo que no está, y revisar un repositorio lleno de promesas es
peor que revisar uno pequeño y completo.

| Carpeta sugerida | Por qué no está |
|---|---|
| `apps/mobile/` | Flutter no está en el alcance. La cobertura móvil se resolvió haciendo responsive la aplicación web: los mismos flujos en teléfono y tablet, sin una segunda base de código. Que la API sirve a clientes no web ya está demostrado —la skill de Alexa consume los mismos endpoints con los mismos privilegios |
| `apps/e2e/` | Deuda consciente. Se cubrió primero la lógica que puede dar un resultado incorrecto en silencio: 129 pruebas sin base de datos ni navegador. Los recorridos completos se verifican a mano contra el sistema levantado |
| `apps/addons/` | Lo que una herramienta propia resolvería ya lo resuelven los scripts de `package.json` y Turborepo. `pnpm setup:backend` prepara la base desde cero y `pnpm dev --filter …` levanta el subconjunto que haga falta |
| `packages/` | Reservada para código compartido entre frontend y backend. No hay ninguno: los dos `commons` cubren cada lado y compilan distinto. Si algún día un tipo tuviera que ser literalmente el mismo objeto en ambos, se crea la carpeta y se vuelve a añadir `packages/*` a `pnpm-workspace.yaml` |
| `stubs/` | Para crear un módulo se copia uno existente —`productos-front` en el frontend, `clientes` en el backend— y se renombra. Un molde que se usa todos los días no se queda obsoleto; una plantilla apartada, sí |
| `agents/` | La gobernanza del trabajo asistido por IA vive en la raíz, que es donde las herramientas la leen sin configuración: `CLAUDE.md`, `DESIGN.md` y `PRODUCT.md`. Duplicarla en una carpeta crearía dos copias que se contradicen a la semana |
| `infra/k8s/`, `infra/observability/` | Un solo servidor. Kubernetes delante de una instancia no orquesta nada, y la observabilidad hoy son los health checks de cada servicio más `pnpm prod:logs` |

---

## Cómo incorporar a alguien nuevo

En este orden, y en menos de una hora:

1. **[`README.md`](../../README.md)** — levantar el sistema completo en local.
   Son cuatro comandos.
2. **[Guía del sistema](../GUIA-DEL-SISTEMA.md)** — qué hace cada módulo
   y quién puede hacer qué.
3. **Este documento** — dónde está cada cosa.
4. **[Decisiones técnicas](./decisiones-tecnicas.md)** — por qué está así.
5. **[Estrategia de ramas](./estrategia-de-ramas.md)** — cómo se contribuye.

Para escribir código hay dos reglas que conviene saber antes de la primera
línea, porque romperlas no falla en compilación:

- **Si un botón está detrás de `can("x:y")`, su endpoint tiene que estar detrás
  de `@RequierePrivilegio("x:y")`.** Esconder botones no protege nada.
- **En `apps/backend/` nunca uses `import type` para una clase que Nest
  inyecta.** Desaparece en tiempo de ejecución y la inyección falla al arrancar,
  sin error de compilación que lo anticipe. Por eso esa regla de Biome está
  apagada ahí.

Y para crear un módulo nuevo, el procedimiento está en
[`CLAUDE.md`](../../CLAUDE.md), en el apartado de convenciones: se copia uno
existente y se registra en tres lugares.
