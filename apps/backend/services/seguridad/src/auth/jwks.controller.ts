import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";

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
