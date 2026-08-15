# Servicio de Ventas POS y Caja

Microservicio `@scipos/ventas-caja-service` (puerto **4005**, schema Postgres `ventas_caja`).

## Endpoints principales

| Método | Ruta | Privilegio |
|---|---|---|
| POST | `/ventas` | `pos:vender` |
| POST | `/ventas/convertir-cotizacion` | identidad (llamada entre servicios) |
| POST | `/ventas/:id/cancelar` | `pos:cancelar` |
| GET | `/ventas/historial?clienteId=` | identidad |
| POST | `/caja/abrir` | `caja:abrir` |
| POST | `/caja/movimiento` | `caja:movimiento` |
| POST | `/caja/cerrar` | `caja:cerrar` |

A través del gateway: `http://localhost:4000/api/ventas-caja/...`

## Arranque local

```bash
cp .env.example .env
pnpm --filter @scipos/ventas-caja-service prisma:migrate
pnpm --filter @scipos/ventas-caja-service seed
pnpm --filter @scipos/ventas-caja-service dev
```

Contrato OpenAPI: `docs/02-api/openapi/services/ventas-caja.yaml`
