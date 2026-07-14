import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { RequiereIdentidad, RequierePrivilegio } from "@scipos/backend-commons";
import { PrivilegiosService } from "../privilegios/privilegios.service";
import { ActualizarUsuarioDto } from "./dto/actualizar-usuario.dto";
import { AjustarPrivilegioUsuarioDto } from "./dto/ajustar-privilegio-usuario.dto";
import { CrearUsuarioDto } from "./dto/crear-usuario.dto";
import { UsuariosService } from "./usuarios.service";

@ApiTags("usuarios")
@Controller("usuarios")
export class UsuariosController {
  constructor(
    private readonly usuarios: UsuariosService,
    private readonly privilegios: PrivilegiosService,
  ) {}

  @Get()
  @ApiOperation({
    summary: "Listar usuarios",
    description: "Endpoint público: el frontend lo usa para poblar el selector de usuario activo.",
  })
  listar() {
    return this.usuarios.listar();
  }

  @Get(":id")
  @RequiereIdentidad()
  @ApiOperation({ summary: "Obtener un usuario por id" })
  @ApiParam({ name: "id", example: "usuario-vendedor" })
  obtener(@Param("id") id: string) {
    return this.usuarios.obtener(id);
  }

  @Get(":id/privilegios")
  @RequiereIdentidad()
  @ApiOperation({ summary: "Privilegios efectivos de un usuario" })
  @ApiParam({ name: "id", example: "usuario-vendedor" })
  privilegiosDeUsuario(@Param("id") id: string) {
    return this.privilegios.privilegiosDeUsuario(id);
  }

  @Post()
  @RequierePrivilegio("seguridad:crear")
  @ApiOperation({ summary: "Registrar un usuario" })
  crear(@Body() dto: CrearUsuarioDto) {
    return this.usuarios.crear(dto);
  }

  @Patch(":id")
  @RequierePrivilegio("seguridad:editar")
  @ApiOperation({ summary: "Actualizar un usuario (datos, rol o estado)" })
  @ApiParam({ name: "id", example: "usuario-vendedor" })
  actualizar(@Param("id") id: string, @Body() dto: ActualizarUsuarioDto) {
    return this.usuarios.actualizar(id, dto);
  }

  @Post(":id/privilegios")
  @RequierePrivilegio("seguridad:asignar")
  @ApiOperation({
    summary: "Conceder o revocar un privilegio a un usuario",
    description:
      "Con concedido=true el usuario gana el privilegio aunque su rol no lo tenga; con concedido=false se le revoca aunque su rol sí lo tenga.",
  })
  @ApiParam({ name: "id", example: "usuario-vendedor" })
  ajustarPrivilegio(@Param("id") id: string, @Body() dto: AjustarPrivilegioUsuarioDto) {
    return this.usuarios.ajustarPrivilegio(id, dto);
  }

  @Delete(":id/privilegios/:privilegio")
  @RequierePrivilegio("seguridad:asignar")
  @ApiOperation({ summary: "Quitar un ajuste de privilegio por usuario" })
  @ApiParam({ name: "id", example: "usuario-vendedor" })
  @ApiParam({ name: "privilegio", example: "pos:descuento" })
  quitarAjuste(@Param("id") id: string, @Param("privilegio") privilegio: string) {
    return this.usuarios.quitarAjuste(id, privilegio);
  }
}
