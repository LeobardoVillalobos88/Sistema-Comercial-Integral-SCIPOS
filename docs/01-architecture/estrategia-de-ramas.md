# Estrategia de ramas

Responde las siete preguntas guía del enunciado. Es la estrategia que el equipo
ya venía usando; este documento la escribe, no la inventa —se puede contrastar
con `git log` y con la lista de ramas del repositorio.

---

## ¿Cuáles son las ramas base?

Dos permanentes y una temporal por versión.

| Rama | Qué representa | Se borra |
|---|---|---|
| `main` | Lo que está publicado. Cada commit aquí es una versión que corrió en el servidor | Nunca |
| `develop` | La integración. Todo lo terminado vive aquí antes de publicarse | Nunca |
| `release/vX.Y` | La foto de una versión concreta | Se conserva como registro |

Hoy existen `release/v1.0`, `v1.1`, `v2.0` y `v2.1`.

**Por qué dos ramas base y no una.** Con solo `main` habría que elegir entre
publicar cada cambio en cuanto se termina —el servidor tarda entre 5 y 15 minutos
en reconstruir, y durante ese rato el sistema está abajo— o acumular trabajo sin
integrar. `develop` permite juntar el trabajo de cinco personas a diario y
publicar cuando conviene. Es especialmente útil cuando la fecha de publicación la
marca una entrega y no el ritmo del desarrollo.

## ¿Qué representa cada rama?

- **`main`.** Corresponde a lo que corre en el servidor. El procedimiento de
  despliegue (`docs/DESPLIEGUE-AWS.md`) clona y hace `checkout main`. Si `main`
  no compila, el sistema no se puede reconstruir.
- **`develop`.** Trabajo terminado y revisado, integrado pero todavía no
  publicado. Es la rama de la que se parte para empezar algo nuevo.
- **`release/vX.Y`.** Se crea desde `develop` cuando la versión está lista, se
  fusiona a `main` y se conserva. Sirve para responder "¿qué exactamente estaba
  corriendo en la presentación del avance 2?" sin depender de la memoria.
- **Ramas de trabajo.** Una tarea, una rama. Nacen de `develop` y vuelven a
  `develop`.

## ¿Cómo se integran los cambios?

**Pull request hacia `develop`, revisado por otra persona.** Nunca se empuja
directo a `develop` ni a `main`.

El ciclo completo:

```bash
git checkout develop && git pull origin develop
git checkout -b feature/reportes-exportables
# … trabajo, uno o varios commits …
git push -u origin feature/reportes-exportables
# se abre el PR en GitHub, alguien más lo revisa y lo fusiona
```

Cada PR tiene que traer: qué resuelve, cómo probarlo y `pnpm lint`, `pnpm
typecheck` y `pnpm test` en verde. Desde que existe
[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) esos tres los corre
GitHub Actions solo, más la construcción completa y la validación de los
contratos OpenAPI. Un PR en rojo no se fusiona.

Publicar es un segundo paso, deliberadamente aparte: `develop` → `release/vX.Y`
→ `main`, y después el procedimiento de despliegue en el servidor.

**Los merges se hacen con `--no-ff`.** Un avance rápido borraría del historial
que existió una rama; con el merge explícito, `git log --graph` sigue mostrando
qué se hizo en qué tarea. Esos commits de fusión llevan el prefijo `merge:` y se
leen como `merge: fusionar feature/pos-venta a develop`.

## ¿Cómo se nombran las ramas de trabajo?

`tipo/descripcion-en-kebab-case`, en español y describiendo el resultado, no la
tarea.

```
feature/productos-catalogo
feature/cotizaciones-flujo
feature/alexa-skill-almacen
fix/skill-compatible-con-node-16
fix/normalizar-fin-de-linea
style/identidad-visual
```

Sin números de ticket: el equipo no usa un gestor de incidencias, y un número que
no lleva a ninguna parte es ruido. Sin nombres de personas tampoco —la rama es
del proyecto, no de quien la escribió, y `feature/leo-2` no dice nada dentro de
seis meses.

## ¿Qué tipos de ramas se usan?

Los mismos prefijos que los tipos de commit, para no tener dos vocabularios:

| Prefijo | Para qué | Ejemplo real |
|---|---|---|
| `feature/` | Funcionalidad nueva | `feature/clientes-gestion` |
| `fix/` | Corrección de algo que ya estaba | `fix/asistente-en-despliegue` |
| `style/` | Presentación, sin cambio de comportamiento | `style/identidad-visual` |
| `docs/` | Solo documentación | `docs/guia-del-sistema` |
| `refactor/` | Reorganización sin cambio funcional | `refactor/pos-caja-en-piezas` |
| `release/` | Preparación de una versión | `release/v2.1` |

### Mensajes de commit

Conventional Commits **sin ámbito**, con el asunto en español:

```
feat: catalogo de productos con filtros
fix: corrige el subtotal de la cotizacion
docs: documenta la estrategia de ramas
```

Lo valida el hook `commit-msg` con commitlint, y no es opcional: un mensaje mal
formado no llega a ser commit. Se decidió sin ámbito porque la carpeta que cambió
ya se ve en el diff, y ponerla en el mensaje abre una discusión inútil cada vez
que un cambio toca dos módulos.

El hook `pre-commit` corre `pnpm lint` sobre todo el repositorio antes de dejar
confirmar. Tarda menos de un segundo con Biome —si tardara más, alguien
empezaría a saltárselo con `--no-verify`, y un hook que se salta no protege nada.

## ¿Cuándo se borra una rama?

- **Al fusionarse.** El PR se aprueba, se fusiona, y la rama se borra en GitHub
  (`git branch -d` en local). El trabajo ya vive en `develop`; la rama solo
  estorbaría la lista.
- **Al cancelarse una tarea.** Si se decide no seguir, la rama se borra. Una rama
  abandonada dos meses no se retoma: se rehace, porque `develop` ya se movió
  demasiado.
- **Nunca `main` ni `develop`.**
- **Las `release/` se conservan** aunque ya estén fusionadas: son el registro de
  qué se publicó y cuándo.

## ¿Cómo se evitan los conflictos?

Cinco costumbres, ninguna heroica:

**Ramas cortas.** Una rama por tarea, de días y no de semanas. La probabilidad de
conflicto crece con el tiempo que la rama pasa separada, no con su tamaño.

**Actualizar antes de empezar y durante.** `git pull origin develop` antes de
crear la rama, y traer `develop` a la rama mientras se trabaja si la tarea se
alarga. Es más barato resolver tres conflictos pequeños en tres días que quince
juntos al final.

**Repartir por módulo.** El trabajo se divide por microfrontend y por
microservicio, que es justo lo que hace útil esta arquitectura aquí: dos personas
en `productos-front` y `clientes-front` casi no tocan los mismos archivos. Los
puntos de contacto son pocos y conocidos —`commons`, `navegacion.ts`,
`matriz.ts`— y se avisan en el grupo antes de tocarlos.

**Formato automático y decidido de antemano.** Biome impone sangría, comillas,
ancho de línea y orden de importaciones. Sin esa uniformidad, media parte de los
conflictos serían por comillas simples contra dobles. `.gitattributes` fija los
fines de línea, que en un equipo con Windows y Linux es la otra mitad.

**Avisar los cambios transversales.** Tocar `backend-commons` o
`frontend-commons` afecta a todos. Se anuncia antes y se fusiona pronto, en vez
de quedarse una semana en una rama que después choca con cinco.

### Cuando el conflicto ya ocurrió

Se resuelve **en la rama de trabajo**, nunca en `develop`. Se trae `develop` a la
rama, se resuelve ahí, se comprueba que `pnpm lint`, `pnpm typecheck` y
`pnpm test` sigan pasando, y entonces se actualiza el PR. Así `develop` nunca
pasa por un estado roto.

Hay un conflicto que aparece en cada versión y ya tiene procedimiento: fusionar
`release/vX.Y` a `main` cuando `main` recibió correcciones directas. Se resuelve
tomando la versión de la rama de release
(`git merge -s ours` desde la dirección adecuada), porque lo que se quiere
publicar es la versión completa, no una mezcla a medias.
