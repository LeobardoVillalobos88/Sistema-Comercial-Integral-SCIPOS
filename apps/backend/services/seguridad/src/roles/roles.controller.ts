import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { RequiereIdentidad, RequierePrivilegio } from "@scipos/backend-commons";
import { AsignarPrivilegioDto } from "./dto/asignar-privilegio.dto";
import { RolesService } from "./roles.service";

@ApiTags("roles")
@Controller("roles")
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get()
  @RequiereIdentidad()
  @ApiOperation({ summary: "Listar roles con sus privilegios" })
  listar() {
    return this.roles.listar();
  }

  @Post(":clave/privilegios")
  @RequierePrivilegio("seguridad:asignar")
  @ApiOperation({ summary: "Asignar un privilegio a un rol" })
  @ApiParam({ name: "clave", example: "VENDEDOR" })
  asignar(@Param("clave") clave: string, @Body() dto: AsignarPrivilegioDto) {
    return this.roles.asignarPrivilegio(clave, dto.privilegio);
  }

  @Delete(":clave/privilegios/:privilegio")
  @RequierePrivilegio("seguridad:asignar")
  @ApiOperation({ summary: "Quitar un privilegio a un rol" })
  @ApiParam({ name: "clave", example: "VENDEDOR" })
  @ApiParam({ name: "privilegio", example: "productos:crear" })
  revocar(@Param("clave") clave: string, @Param("privilegio") privilegio: string) {
    return this.roles.revocarPrivilegio(clave, privilegio);
  }
}
