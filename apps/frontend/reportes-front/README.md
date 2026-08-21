# Microfrontend de reportes

`@scipos/reportes-front` (puerto **3007**). Los reportes comerciales del sistema:
ventas, cotizaciones, inventario valuado, cortes de caja y utilidad.

Se levanta solo:

```bash
pnpm --filter @scipos/reportes-front dev
```

## Qué muestra

`PanelReportes` es una sola pantalla con cinco pestañas y un filtro por periodo.
Cada pestaña trae sus tarjetas de cifras, su tabla y su botón de descarga.

Los datos salen del servicio de reportes (4006), que no tiene base de datos: los
agrega por REST desde productos, cotizaciones y ventas-caja.

## Tres privilegios, no uno

Es el módulo con la separación de permisos más fina del sistema, y es a
propósito: son tres capacidades distintas.

| Privilegio | Qué habilita | Si falta |
| --- | --- | --- |
| `reportes:ver` | Consultar los reportes | La pantalla entera se sustituye por un aviso |
| `reportes:utilidad` | La pestaña de utilidad y el margen | La pestaña no aparece, y la API responde 403 |
| `reportes:exportar` | Descargar cualquier reporte | El botón no aparece, y la descarga responde 403 |

Las pestañas se filtran, pero **cada `Tab` lleva su `value={indice}` explícito**:
el índice es la identidad de la pestaña —el contenido se decide con él—, así que
esconder la de utilidad no debe correr a las demás de lugar.

## El CSV lo arma el servidor

`descargarReporte()` llama a `GET /reportes/exportar/:tipo` con `guardarArchivo()`
y el navegador guarda lo que llegue. **No se construye el archivo en el cliente**,
aunque la pantalla ya tenga los datos: si se hiciera así, esconder el botón sería
toda la protección, y esconder botones no protege nada. Al pasar por el endpoint,
decide el guard.

El formato del archivo se prueba del lado del servicio, en
`apps/backend/services/reportes/src/reportes/csv.spec.ts`.

## Cómo comprobar que los privilegios funcionan

Desde `/usuarios`, con una cuenta de administrador, revócale
`reportes:utilidad` al supervisor. En su siguiente carga la pestaña desapareció y
las otras cuatro siguen ahí; si pide la dirección directamente, recibe 403.

Los privilegios se cachean 60 segundos, así que entre revocar y probar conviene
esperar un minuto.
