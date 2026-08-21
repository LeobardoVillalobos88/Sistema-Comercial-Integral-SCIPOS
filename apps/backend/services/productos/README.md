# Servicio de productos

Microservicio `@scipos/productos-service` (puerto **4002**, schema PostgreSQL
`productos`). Dueño del catálogo, de las existencias y de las compras a
proveedor.

## Funciones

- Catálogo con lote, caducidad y **dos precios** (compra y venta), baja lógica y
  borrado definitivo, que responde 409 si el producto ya está referenciado por
  una compra.
- Compras a proveedor: transaccionales, incrementan existencias y guardan de
  quién se compró. El historial devuelve cada partida ya resuelta a nombre y
  lote, para que quien lo consuma no tenga que cruzar contra el catálogo.
- Movimiento de existencias (`POST /:id/stock`): endpoint interno que consume
  ventas-caja con un delta positivo o negativo, con guarda contra dejar el stock
  en negativo.
- Alertas de inventario: lotes vencidos o por vencer, y productos agotados o con
  existencia baja. Los umbrales salen del entorno (`UMBRAL_STOCK_BAJO`,
  `DIAS_AVISO_CADUCIDAD`) y **los lee también el resumen del dashboard**, para
  que el aviso y el tablero no den cifras distintas del mismo catálogo.

## Rutas y privilegios

El controlador del catálogo monta bajo el prefijo `productos`, así que a través
del gateway la ruta se duplica: `/api/productos/productos/...`. Compras monta en
`compras` → `/api/productos/compras`. Equivocarse aquí produce un 404 que parece
un registro inexistente.

| Método | Ruta | Privilegio |
| --- | --- | --- |
| GET | `/productos` | `productos:ver` |
| GET | `/productos/:id` | `productos:ver` |
| GET | `/productos/alertas` | `productos:ver` |
| GET | `/productos/resumen` | identidad (dashboard) |
| POST | `/productos` | `productos:crear` |
| PATCH | `/productos/:id` | `productos:editar` |
| PATCH | `/productos/:id/estado` | `productos:desactivar` |
| DELETE | `/productos/:id` | `productos:eliminar` |
| POST | `/productos/:id/stock` | identidad (llamada entre servicios) |
| GET | `/compras` | `compras:ver` |
| POST | `/compras` | `compras:ver` |

> `alertas` y `resumen` se declaran **antes** que `:id` en el controlador. Al
> revés, la ruta dinámica se los tragaría creyendo que son identificadores.

## Desarrollo local

```bash
cp apps/backend/services/productos/.env.example apps/backend/services/productos/.env
pnpm --filter @scipos/productos-service prisma:migrate
pnpm --filter @scipos/productos-service seed
pnpm --filter @scipos/productos-service dev
```

## Pruebas

```bash
pnpm --filter @scipos/productos-service test
```

`alertas-inventario.spec.ts` prueba la clasificación sin tocar la base. Cuidado
con una diferencia intencional: las alertas **incluyen** lo ya vencido, mientras
que el `proximosACaducar` del resumen lo excluye, porque el dashboard rotula esa
cifra como "por caducar".

Contrato: `docs/02-api/openapi/services/productos.yaml`
