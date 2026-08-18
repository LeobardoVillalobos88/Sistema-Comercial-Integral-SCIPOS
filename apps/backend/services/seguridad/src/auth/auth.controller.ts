import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { RequiereIdentidad, UsuarioActual, VerificadorToken } from "@scipos/backend-commons";
import { AuthService } from "./auth.service";
import { IniciarSesionDto } from "./dto/iniciar-sesion.dto";
import { RefrescarDto } from "./dto/refrescar.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly verificador: VerificadorToken,
  ) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Iniciar sesión con correo y contraseña",
    description:
      "Devuelve un access token JWT RS256 (Authorization: Bearer), un refresh token, el usuario y sus privilegios efectivos.",
  })
  iniciarSesion(@Body() dto: IniciarSesionDto) {
    return this.auth.iniciarSesion(dto);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Renovar la sesión con un refresh token",
    description:
      "Rota el refresh token (el anterior queda inutilizable) y entrega un access token nuevo. Reusar un token ya consumido cierra la sesión por seguridad.",
  })
  refrescar(@Body() dto: RefrescarDto) {
    return this.auth.refrescar(dto.refreshToken);
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Cerrar sesión (revoca el token al instante)",
    description:
      "Agrega el access token a la denylist y revoca los refresh del usuario. Idempotente: funciona aunque el access ya haya expirado.",
  })
  async cerrarSesion(@Headers("authorization") autorizacion?: string) {
    if (!autorizacion?.startsWith("Bearer ")) {
      return { sesionCerrada: true };
    }
    try {
      const { payload } = await this.verificador.verificar(autorizacion.slice("Bearer ".length));
      return this.auth.cerrarSesion(
        payload.sub ?? "",
        payload.jti,
        typeof payload.exp === "number" ? payload.exp : undefined,
      );
    } catch {
      return { sesionCerrada: true };
    }
  }

  @Get("perfil")
  @RequiereIdentidad()
  @ApiOperation({
    summary: "Usuario y privilegios del token vigente",
    description:
      "Permite restaurar la sesión al recargar la página sin volver a pedir credenciales.",
  })
  perfil(@UsuarioActual() usuarioId: string) {
    return this.auth.perfil(usuarioId);
  }
}
