import { type ExecutionContext, createParamDecorator } from "@nestjs/common";

export const UsuarioActual = createParamDecorator(
  (_datos: unknown, contexto: ExecutionContext): string => {
    const peticion = contexto.switchToHttp().getRequest<{ usuarioId?: string }>();
    return peticion.usuarioId ?? "";
  },
);
