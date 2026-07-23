import { type ExecutionContext, createParamDecorator } from "@nestjs/common";

/**
 * Inyecta el id del usuario ya autenticado por el guard de privilegios.
 * Úsalo únicamente en endpoints decorados con @RequierePrivilegio o
 * @RequiereIdentidad (en endpoints públicos llega vacío).
 *
 * Ejemplo:
 *   @Post()
 *   @RequierePrivilegio("pos:vender")
 *   crear(@Body() dto: CrearVentaDto, @UsuarioActual() usuarioId: string) { ... }
 */
export const UsuarioActual = createParamDecorator(
  (_datos: unknown, contexto: ExecutionContext): string => {
    const peticion = contexto.switchToHttp().getRequest<{ usuarioId?: string }>();
    return peticion.usuarioId ?? "";
  },
);
