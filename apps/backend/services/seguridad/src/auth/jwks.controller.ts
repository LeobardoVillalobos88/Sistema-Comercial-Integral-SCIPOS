import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";

/**
 * Publica la llave pública de firma en formato JWKS. Los demás servicios y el
 * gateway la consumen (endpoint público) para verificar los tokens RS256 sin
 * poder emitirlos.
 */
@ApiTags("auth")
@Controller(".well-known")
export class JwksController {
  constructor(private readonly auth: AuthService) {}

  @Get("jwks.json")
  @ApiOperation({ summary: "JWKS con la llave pública de verificación de tokens" })
  jwks() {
    return this.auth.obtenerJwks();
  }
}
