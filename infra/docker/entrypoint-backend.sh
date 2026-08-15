#!/bin/sh
# Arranque de cualquiera de los procesos de backend.
#
# El contenedor entra con working_dir en la carpeta del servicio, de modo que
# las rutas relativas de Prisma resuelven contra el esquema correcto.
set -e

SERVICIO="$(basename "$PWD")"

# Las migraciones se aplican antes de levantar el proceso. `migrate deploy` es
# idempotente: si la base ya está al día no hace nada, así que puede quedar
# activo de forma permanente sin riesgo.
if [ "${EJECUTAR_MIGRACIONES}" = "true" ] && [ -f "prisma/schema.prisma" ]; then
  echo "[entrypoint] ${SERVICIO}: aplicando migraciones pendientes..."
  pnpm exec prisma migrate deploy
fi

# La semilla se ejecuta solo cuando se pide de forma explícita, para no
# reescribir datos en cada reinicio del contenedor.
if [ "${EJECUTAR_SEMILLA}" = "true" ] && [ -f "prisma/seed.ts" ]; then
  echo "[entrypoint] ${SERVICIO}: cargando datos semilla..."
  pnpm exec tsx prisma/seed.ts
fi

exec "$@"
