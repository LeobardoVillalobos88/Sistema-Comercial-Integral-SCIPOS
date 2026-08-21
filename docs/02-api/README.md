# Contratos de API

Los contratos OpenAPI de cada microservicio viven en `openapi/services/` y se escriben
**antes** de implementar los endpoints (contrato primero). El contrato es lo que los
demás integrantes usan para integrarse con tu servicio sin esperarte.

## Flujo de trabajo

1. Copia la estructura de `openapi/services/seguridad.yaml` (es el ejemplo a seguir).
2. Define rutas, DTOs, códigos de error y **qué privilegio protege cada operación**.
3. Implementa el servicio respetando el contrato. Los decoradores de Swagger generan la
   documentación viva en `<servicio>/docs` (Scalar) y `<servicio>/api-json`.
4. Si el contrato cambia durante el desarrollo, actualiza el YAML en el mismo PR.

## Convenciones

- Todas las rutas públicas pasan por el gateway: `http://localhost:4000/api/<servicio>/...`
- La identidad viaja como **Bearer JWT (RS256)**, verificado en el gateway y en cada
  servicio contra el JWKS de seguridad; `x-usuario-id` es solo el canal interno entre
  servicios (el gateway lo descarta de las peticiones externas). Sin token válido en un
  endpoint protegido: **401**; sin el privilegio requerido: **403**.
- Los errores usan el formato estándar del backend: `{ estatus, mensaje, error, ruta, fecha }`.
- Los seis contratos se validan en cada empujón: el trabajo `contratos` de
  [la integración continua](../../.github/workflows/ci.yml) los parsea y falla si
  alguno queda mal formado. Un YAML roto no avisa hasta que alguien abre `/docs`.
