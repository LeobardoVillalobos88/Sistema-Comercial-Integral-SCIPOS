# example-front: plantilla de microfrontend

Esta app es la **referencia** para crear tu microfrontend de dominio. No la edites:
**cópiala** y trabaja sobre tu copia.

## Cómo crear tu módulo a partir de esta plantilla

1. Copia la carpeta:
   ```bash
   cp -r apps/frontend/example-front apps/frontend/<tu-modulo>-front
   ```
2. Cambia el `name` en `package.json` a `@scipos/<tu-modulo>-front` y ajusta el
   puerto del script `dev` (usa uno distinto: 3003, 3004, …).
3. Instala dependencias desde la raíz: `pnpm install`.
4. Corre tu módulo solo: `pnpm --filter @scipos/<tu-modulo>-front dev`.

## Qué demuestra

- Cómo consumir el Design System: `PageHeader`, `SearchableTable`, `EstadoChip`.
- Cómo usar los datos de catálogo compartidos (`PRODUCTOS_MOCK`).
- Cómo **ocultar acciones por privilegio** con `<Permiso requiere="...">`.
- Cómo montar los proveedores (tema + permisos) cuando la app corre sola.
