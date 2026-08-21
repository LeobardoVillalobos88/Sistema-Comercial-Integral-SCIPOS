# pos-caja-front: punto de venta, compras y caja

Microfrontend del módulo de Ventas POS y Caja (RF-18 a RF-26).

## Correrlo solo

```bash
pnpm install
pnpm --filter @scipos/pos-caja-front dev   # http://localhost:3006
```

## Qué hace

Un mismo componente, `PosCajaPage`, atiende tres rutas del shell según sus props:

| Ruta | Props | Comportamiento |
|---|---|---|
| `/pos` | `defaultTab={0} hideTabs` | Cobra a precio de venta y descuenta existencia. Exige caja abierta. |
| `/compras` | `modo="compra" defaultTab={0} hideTabs` | Compra a precio de compra y suma existencia. No exige caja. |
| `/caja` | `defaultTab={1} hideTabs` | Abre directamente la pestaña de caja. |

`modo` vale `"venta"` por defecto, así que `/pos` no necesita pasarlo.

- **Punto de venta:** carrito con cantidades, descuento manual (solo con
  `pos:descuento`), cancelación (`pos:cancelar`) y cobro. El envío a la API
  lleva únicamente `productoId` y `cantidad`: **el backend cotiza cada partida
  desde el catálogo y nunca confía en un precio mandado por el cliente**.
- **Caja:** apertura con fondo inicial, ingresos y egresos manuales, corte del
  turno y los historiales de ventas y de cortes. `CajaContext` rehidrata el turno
  abierto desde `GET /ventas-caja/caja/estado` al montar, así que recargar la
  página no pierde el turno.
- Las acciones sensibles se ocultan con `<Permiso requiere="pos:..." />` o
  `can("caja:...")`, y el backend revalida cada una con `@RequierePrivilegio`.

## Cómo está organizado

El módulo separa el cálculo del dinero de la interfaz, para que se pueda probar
sin montar React:

```
src/
  calculos/calculos-pos.ts    # aritmética pura + transformaciones del carrito
  calculos/calculos-pos.spec.ts
  hooks/useCarrito.ts         # estado del carrito; deriva los importes
  components/PanelCaja.tsx    # toda la pestaña de caja
  components/PanelSeccion.tsx # primitivas que comparten ambas pestañas
  components/ResumenMonto.tsx
  context/CajaContext.tsx     # turno de caja compartido
  api/posApi.ts               # llamadas al gateway
  PosCajaPage.tsx             # orquesta: API, privilegios, avisos, pestaña de venta
```

`PanelCaja` no guarda estado propio: recibe todo por props y solo presenta. Toda
la decisión vive en `PosCajaPage`.

Los importes salen de `calcularTotales`, que recorta el descuento al subtotal
para que el total nunca sea negativo. No suma impuesto: los precios del catálogo
son los finales al público. Son cifras de pantalla, y la venta que se registra la
vuelve a calcular el backend.

## Pruebas

```bash
pnpm --filter @scipos/pos-caja-front test
```

Cubren el cálculo de importes y las transformaciones del carrito (agregar, sumar
o restar unidades, quitar partidas). No necesitan navegador ni servidor.

## Backend

El servicio vive en `apps/backend/services/ventas-caja`
(`@scipos/ventas-caja-service`, puerto 4005, schema `ventas_caja`):

```bash
pnpm --filter @scipos/ventas-caja-service prisma:migrate
pnpm --filter @scipos/ventas-caja-service seed
pnpm --filter @scipos/ventas-caja-service dev
```

## Integración en el web-shell

`apps/frontend/web-shell/src/app/pos/page.tsx`, `.../compras/page.tsx` y
`.../caja/page.tsx` importan `<PosCajaPage />` desde este paquete con distintas
props.
