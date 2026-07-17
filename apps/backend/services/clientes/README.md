# example-service · Plantilla de microservicio SCIPOS

Plantilla oficial para crear un microservicio de dominio. Sigue el mismo patrón en todos
los servicios: NestJS + Prisma (PostgreSQL) + Redis + Swagger con Scalar + guard de
privilegios de `@scipos/backend-commons`.

## Cómo crear tu servicio a partir de esta plantilla

1. Copia esta carpeta como `apps/backend/services/<tu-dominio>` (ej. `productos`).
2. En `package.json` cambia `name` a `@scipos/<tu-dominio>-service` y la descripción.
3. Crea tu `.env` a partir de `.env.example` con **tu puerto** (productos 4002,
   clientes 4003, cotizaciones 4004, ventas-caja 4005) y **tu schema** en el
   `DATABASE_URL` (ej. `?schema=productos`).
4. Reemplaza el modelo `Ejemplo` de `prisma/schema.prisma` por tus tablas y borra la
   carpeta `prisma/migrations` si existiera (tus migraciones se generan con
   `pnpm --filter @scipos/<tu-dominio>-service prisma:migrate`).
5. Renombra el módulo `ejemplos` por tu recurso y protege cada endpoint con
   `@RequierePrivilegio("modulo:accion")`. Si tu módulo necesita privilegios que no
   existen en el catálogo, regístralos en el seed del servicio de seguridad o vía
   `POST /api/seguridad/privilegios` (requiere `seguridad:asignar`).
6. Escribe tus seeds en `prisma/seed.ts` con los **mismos IDs que los mocks del frontend**.
7. Registra tu servicio en el gateway (`apps/backend/gateway/src/config/servicios.ts`)
   si aún no está en la tabla de enrutamiento.
8. Escribe tu contrato en `docs/02-api/openapi/services/<tu-dominio>.yaml` **antes** de
   implementar los endpoints.

## Comandos

```bash
pnpm --filter @scipos/example-service prisma:migrate   # crea/aplica migraciones (pide nombre)
pnpm --filter @scipos/example-service seed             # datos semilla
pnpm --filter @scipos/example-service dev              # levanta el servicio
```

Con el servicio corriendo: `/health` responde el estado, `/docs` muestra Scalar y
`/api-json` expone el OpenAPI generado.

## Cómo funciona la protección de endpoints

- `@RequierePrivilegio("ejemplo:crear")` responde **401** sin header `x-usuario-id` y
  **403** si el usuario no tiene el privilegio (el guard consulta al servicio de
  seguridad; configura `SEGURIDAD_URL` en tu `.env`).
- `@RequiereIdentidad()` solo exige que venga el header (401 si falta).
- Sin decorador, el endpoint es público. Úsalo únicamente para lecturas que de verdad
  no requieren control.

Los privilegios `ejemplo:*` de esta plantilla no están en el catálogo, así que solo el
usuario administrador (acceso total) puede usar sus endpoints de escritura: sirve para
comprobar que el guard funciona.
