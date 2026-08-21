# Backend commons

`@scipos/backend-commons`. Biblioteca compartida por el gateway y los seis
servicios. **Se compila con `tsc` a `dist/`**, al revés que la de frontend, que
es solo fuentes: los servicios la consumen como `workspace:*` y Turborepo la
construye primero (`dev` y `build` dependen de `^build`).

No se cruza nunca con `apps/frontend/commons`. No es duplicación: compilan
distinto, y una biblioteca común a las dos acabaría arrastrando React al backend
o Nest al navegador.

## Qué exporta

**Seguridad** (`src/seguridad/`) — el corazón del sistema de privilegios:

| Pieza | Para qué |
| --- | --- |
| `@RequierePrivilegio("modulo:accion")` | Declara el permiso junto al endpoint que protege |
| `@RequiereIdentidad()` | Exige estar identificado, sin privilegio concreto |
| `@UsuarioActual()` | Entrega el identificador que el guard ya resolvió |
| `GuardPrivilegios` | Pregunta en orden: identidad → lista de revocados → privilegio |
| `ModuloSeguridad.registrar()` | Registra el guard como global y resuelve las tres estrategias |
| `ExtractorIdentidadJwt` | Bearer RS256 contra el JWKS; cae a `x-usuario-id` entre servicios |
| `VerificadorToken` | `createRemoteJWKSet` más comprobación de emisor y audiencia |
| `DenylistRedis` | Consulta de tokens revocados por cierre de sesión |

`ModuloSeguridad.registrar()` acepta implementaciones propias de
`ProveedorPrivilegios`, `ExtractorIdentidad` y `VerificadorDenylist`. Es lo que
permite que el servicio de seguridad se responda a sí mismo en vez de llamarse
por la red, sin que el guard sepa cuál tiene enfrente.

**HTTP** (`src/http/`) — `ClienteHttp`, el cliente REST entre servicios: tiempo
de espera de 5 s, propagación de la identidad y traducción de errores remotos a
excepciones de Nest conservando el estatus original.

**Contratos** (`src/contratos/`) — `UsuarioSesion`, `ProveedorPrivilegios`,
`ResultadoVerificacion`, y los ayudantes de emisor, audiencia y JWKS.

**Utilidades** (`src/utils/`) — `FiltroExcepcionesHttp`, que normaliza todo error
a `{ estatus, mensaje, error, ruta, fecha }` con el mensaje en español.

## Cuidado al editar

**Nunca uses `import type` para una clase que Nest inyecta.** Desaparece en
tiempo de ejecución y la inyección falla al arrancar, sin error de compilación
que lo anticipe. Por eso la regla `useImportType` de Biome está apagada en todo
`apps/backend/`; no la vuelvas a encender ahí.

## Construcción

```bash
pnpm --filter @scipos/backend-commons build
```

Suele no hacer falta llamarlo a mano: `pnpm dev --filter <servicio>` pasa por
Turborepo, que lo compila antes.
