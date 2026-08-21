# Servicio de Ventas POS y Caja

Microservicio `@scipos/ventas-caja-service` (puerto **4005**, schema Postgres `ventas_caja`).

## Endpoints principales

| Método | Ruta | Privilegio |
|---|---|---|
| POST | `/ventas` | `pos:vender` |
| POST | `/ventas/convertir-cotizacion` | identidad (llamada entre servicios) |
| POST | `/ventas/:id/cancelar` | `pos:cancelar` |
| GET | `/ventas/:id/comprobante` | `ventas:comprobante` |
| GET | `/ventas/historial?clienteId=` | identidad |
| GET | `/ventas?clienteId&desde&hasta` | identidad |
| GET | `/caja/estado` | identidad |
| GET | `/caja/cortes` | identidad |
| POST | `/caja/abrir` | `caja:abrir` |
| POST | `/caja/movimiento` | `caja:movimiento` |
| POST | `/caja/cerrar` | `caja:cerrar` |

A través del gateway: `http://localhost:4000/api/ventas-caja/...`

Emitir el comprobante tiene privilegio propio y **no viene incluido en entrar al
punto de venta**: cobrar es la operación del día, y reimprimir el comprobante de
una venta ajena es sacar del sistema el nombre del cliente y lo que compró.

Las dos rutas que crean una venta —`POST /ventas` y `POST /ventas/convertir-cotizacion`—
pasan por la misma función: exigen caja abierta, **vuelven a leer el precio de cada
partida del servicio de productos** en vez de creerle al cliente, y aplican el
descuento solo si quien lo pide tiene `pos:descuento`.

## Arranque local

```bash
cp .env.example .env
pnpm --filter @scipos/ventas-caja-service prisma:migrate
pnpm --filter @scipos/ventas-caja-service seed
pnpm --filter @scipos/ventas-caja-service dev
```

Contrato OpenAPI: `docs/02-api/openapi/services/ventas-caja.yaml`
