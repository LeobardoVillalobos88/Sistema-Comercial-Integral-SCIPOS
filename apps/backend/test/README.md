# Pruebas de integración del backend

Carpeta para pruebas que cruzan varios servicios (flujos completos a través del gateway).

- Las colecciones de Postman y sus environments viven en `docs/02-api/postman/`.
- Los scripts de prueba automatizados que se agreguen aquí deben poder correrse con
  la infraestructura local levantada (`pnpm infra:up`) y los servicios en ejecución.
