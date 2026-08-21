# Servicio de seguridad

Microservicio `@scipos/seguridad-service` (puerto **4001**, schema PostgreSQL
`seguridad`). Es la fuente de verdad de identidad y privilegios de todo el
sistema: **el único que firma tokens** y el único que decide quién puede qué.

## Funciones

- Inicio de sesión con bcrypt, y firma de access tokens **RS256** con la llave
  privada. La pública se publica en el JWKS para que los demás verifiquen sin
  poder falsificar.
- Refresh token rotatorio, guardado con hash y agrupado por `familyId`: reusar
  uno ya consumido revoca la familia completa (defensa contra robo).
- Cierre de sesión que agrega el `jti` a una lista de revocados en Redis, lo que
  corta la sesión en los siete procesos al instante.
- CRUD de usuarios, con guarda contra borrarse a uno mismo.
- Motor de privilegios: catálogo, matriz por rol y ajustes por usuario. Los
  **privilegios efectivos** son los del rol, más los concedidos, menos los
  revocados; se cachean 60 s en Redis y la caché se invalida en cuanto cambia
  una asignación.

## Rutas y privilegios

A través del gateway: `http://localhost:4000/api/seguridad/...`

| Método | Ruta | Privilegio |
| --- | --- | --- |
| POST | `/auth/login` | — (público) |
| POST | `/auth/refresh` | — (público, valida el refresh) |
| POST | `/auth/logout` | — (público, revoca el token que trae) |
| GET | `/auth/perfil` | identidad |
| GET | `/.well-known/jwks.json` | — (público, llave de verificación) |
| GET | `/usuarios` | `seguridad:ver` |
| GET | `/usuarios/:id` | identidad |
| GET | `/usuarios/:id/privilegios` | identidad |
| POST | `/usuarios` | `seguridad:crear` |
| PATCH | `/usuarios/:id` | `seguridad:editar` |
| DELETE | `/usuarios/:id` | `seguridad:eliminar` |
| POST | `/usuarios/:id/privilegios` | `seguridad:asignar` |
| DELETE | `/usuarios/:id/privilegios/:privilegio` | `seguridad:asignar` |
| GET | `/roles` | identidad |
| POST | `/roles/:clave/privilegios` | `seguridad:asignar` |
| DELETE | `/roles/:clave/privilegios/:privilegio` | `seguridad:asignar` |
| GET | `/privilegios` | identidad |
| POST | `/privilegios` | `seguridad:asignar` |
| GET | `/privilegios/verificar?usuarioId&privilegio` | — (lo llaman los guards) |

La clave de un privilegio nuevo debe cumplir `^[a-z]+:[a-z]+$`: solo minúsculas,
sin dígitos ni guiones. El servicio rechaza cualquier otra cosa.

## Desarrollo local

```bash
cp apps/backend/services/seguridad/.env.example apps/backend/services/seguridad/.env
pnpm generar:llaves
pnpm --filter @scipos/seguridad-service prisma:migrate
pnpm --filter @scipos/seguridad-service seed
pnpm --filter @scipos/seguridad-service dev
```

`pnpm generar:llaves` deja el par RSA en `keys/`, que está ignorada por git: cada
instalación genera la suya, porque quien tenga la privada puede emitir tokens
válidos.

## Pruebas

```bash
pnpm --filter @scipos/seguridad-service test
```

`privilegios.service.spec.ts` fija la regla que más pesa en la evaluación: los
privilegios efectivos son los del rol más los concedidos menos los revocados, y
**una revocación individual le gana incluso a un rol con acceso total**. No
necesita base de datos ni Redis: se le inyectan objetos planos.

Contrato: `docs/02-api/openapi/services/seguridad.yaml`
