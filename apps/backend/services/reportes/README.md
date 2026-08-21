# Servicio de reportes

Microservicio `@scipos/reportes-service` (puerto **4006**). **No tiene base de
datos**: es un agregador. Pide por REST a los demás servicios propagando la
identidad de quien preguntó, y arma la respuesta.

Es la única carpeta de `services/` sin `prisma/`, y no es un olvido: si tuviera
tablas propias tendría que mantenerlas sincronizadas con los servicios de los que
copia, y dejaría de ser una fachada para convertirse en una segunda verdad.

## Funciones

- Reportes de ventas, cotizaciones, inventario valuado y cortes de caja.
- Utilidad del periodo: ingresos, menos costo de ventas (precio de compra actual
  de cada producto vendido), menos descuentos otorgados, con su margen. Se cachea
  30 s en Redis.
- Exportación a CSV de los cuatro reportes tabulares.

## Rutas y privilegios

A través del gateway: `http://localhost:4000/api/reportes/reportes/...`

| Método | Ruta | Privilegio |
| --- | --- | --- |
| GET | `/reportes/ventas` | `reportes:ver` |
| GET | `/reportes/cotizaciones` | `reportes:ver` |
| GET | `/reportes/productos` | `reportes:ver` |
| GET | `/reportes/cortes` | `reportes:ver` |
| GET | `/reportes/utilidad` | `reportes:utilidad` |
| GET | `/reportes/exportar/:tipo` | `reportes:exportar` |

Tres privilegios y no uno, porque son tres capacidades distintas: mirar la
operación, conocer el margen del negocio y sacar la información en un archivo.

`:tipo` acepta `ventas`, `cotizaciones`, `inventario` o `cortes`; cualquier otra
cosa responde 400. La utilidad no se exporta: son cinco cifras, no una tabla.

**El CSV lo arma el servidor, no el navegador.** Si el archivo se construyera con
los datos que la pantalla ya tiene, esconder el botón sería toda la protección, y
esconder botones no protege nada.

## Desarrollo local

No necesita migraciones ni semilla, pero sí que estén arriba los servicios de los
que se alimenta: productos (4002), cotizaciones (4004) y ventas-caja (4005).

```bash
cp apps/backend/services/reportes/.env.example apps/backend/services/reportes/.env
pnpm --filter @scipos/reportes-service dev
```

## Pruebas

```bash
pnpm --filter @scipos/reportes-service test
```

`csv.spec.ts` cubre el formato del archivo sin levantar los cinco servicios de
los que se alimenta un reporte: comillas escapadas, comas que no parten la fila,
saltos CRLF y la marca de orden de bytes que evita que Excel rompa los acentos.

Contrato: `docs/02-api/openapi/services/reportes.yaml`
