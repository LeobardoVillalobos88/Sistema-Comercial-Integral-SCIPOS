import { Body, Controller, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import { HEADER_USUARIO_ID, RequiereIdentidad, UsuarioActual } from "@scipos/backend-commons";
import { AuthService } from "./auth.service";
import { IniciarSesionDto } from "./dto/iniciar-sesion.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Iniciar sesión con correo y contraseña",
    description:
      "Devuelve un token JWT (usarlo como Authorization: Bearer <token>), el usuario y sus privilegios efectivos.",
  })
  iniciarSesion(@Body() dto: IniciarSesionDto) {
    return this.auth.iniciarSesion(dto);
  }

  @Get("perfil")
  @RequiereIdentidad()
  @ApiOperation({
    summary: "Usuario y privilegios del token vigente",
    description:
      "Permite restaurar la sesión al recargar la página sin volver a pedir credenciales.",
  })
  @ApiHeader({ name: HEADER_USUARIO_ID, required: false })
  perfil(@UsuarioActual() usuarioId: string) {
    return this.auth.perfil(usuarioId);
  }
}
