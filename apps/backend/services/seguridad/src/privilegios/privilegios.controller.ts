import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { RequiereIdentidad, RequierePrivilegio } from "@scipos/backend-commons";
import type { ResultadoVerificacion } from "@scipos/backend-commons";
import { CrearPrivilegioDto } from "./dto/crear-privilegio.dto";
import { PrivilegiosService } from "./privilegios.service";

@ApiTags("privilegios")
@Controller("privilegios")
export class PrivilegiosController {
  constructor(private readonly privilegios: PrivilegiosService) {}

  @Get()
  @RequiereIdentidad()
  @ApiOperation({ summary: "Listar el catálogo de privilegios" })
  listar() {
    return this.privilegios.listarCatalogo();
  }

  @Post()
  @RequierePrivilegio("seguridad:asignar")
  @ApiOperation({ summary: "Registrar un privilegio en el catálogo" })
  registrar(@Body() dto: CrearPrivilegioDto) {
    return this.privilegios.registrar(dto);
  }

  @Get("verificar")
  @ApiOperation({
    summary: "Verificar si un usuario tiene un privilegio",
    description:
      "Endpoint de uso interno: lo consultan los guards de los demás servicios en cada petición protegida.",
  })
  @ApiQuery({ name: "usuarioId", example: "usuario-vendedor" })
  @ApiQuery({ name: "privilegio", example: "productos:crear" })
  verificar(
    @Query("usuarioId") usuarioId: string,
    @Query("privilegio") privilegio: string,
  ): Promise<ResultadoVerificacion> {
    return this.privilegios.verificar(usuarioId ?? "", privilegio ?? "");
  }
}
