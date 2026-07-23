import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import {
  HEADER_USUARIO_ID,
  RequiereIdentidad,
  RequierePrivilegio,
  UsuarioActual,
} from "@scipos/backend-commons";
import { ClientesService } from "./clientes.service";
import { ActualizarClienteDto } from "./dto/actualizar-cliente.dto";
import { ActualizarEstadoDto } from "./dto/actualizar-estado.dto";
import { CrearClienteDto } from "./dto/crear-cliente.dto";

@ApiTags("clientes")
@Controller()
export class ClientesController {
  constructor(private readonly clientes: ClientesService) {}

  // Declarado antes de las rutas con ":id" para que la ruta dinámica no lo capture.
  @Get("resumen")
  @RequiereIdentidad()
  @ApiOperation({ summary: "Resumen de clientes para el dashboard" })
  @ApiHeader({ name: HEADER_USUARIO_ID, required: true })
  resumen() {
    return this.clientes.resumen();
  }

  @Get()
  @RequierePrivilegio("clientes:ver")
  @ApiOperation({ summary: "Listar clientes con búsqueda opcional" })
  @ApiQuery({
    name: "busqueda",
    required: false,
    description: "Filtrar por nombre, RFC, correo o teléfono",
  })
  @ApiHeader({ name: HEADER_USUARIO_ID, required: true, description: "ID del usuario activo" })
  listar(@Query("busqueda") busqueda?: string) {
    return this.clientes.listar(busqueda);
  }

  @Get(":id")
  @RequierePrivilegio("clientes:ver")
  @ApiOperation({ summary: "Obtener detalles de un cliente por ID" })
  @ApiParam({ name: "id", example: "c-001" })
  @ApiHeader({ name: HEADER_USUARIO_ID, required: true })
  obtener(@Param("id") id: string) {
    return this.clientes.obtener(id);
  }

  @Get(":id/historial")
  @RequierePrivilegio("clientes:ver")
  @ApiOperation({ summary: "Obtener historial de cotizaciones y ventas de un cliente" })
  @ApiParam({ name: "id", example: "c-001" })
  @ApiHeader({ name: HEADER_USUARIO_ID, required: true })
  obtenerHistorial(@Param("id") id: string, @UsuarioActual() usuarioId: string) {
    return this.clientes.obtenerHistorial(id, usuarioId);
  }

  @Post()
  @RequierePrivilegio("clientes:crear")
  @ApiOperation({ summary: "Registrar un nuevo cliente" })
  @ApiHeader({ name: HEADER_USUARIO_ID, required: true })
  crear(@Body() dto: CrearClienteDto) {
    return this.clientes.crear(dto);
  }

  @Patch(":id")
  @RequierePrivilegio("clientes:editar")
  @ApiOperation({ summary: "Actualizar datos de un cliente" })
  @ApiParam({ name: "id", example: "c-001" })
  @ApiHeader({ name: HEADER_USUARIO_ID, required: true })
  actualizar(@Param("id") id: string, @Body() dto: ActualizarClienteDto) {
    return this.clientes.actualizar(id, dto);
  }

  @Patch(":id/estado")
  @RequierePrivilegio("clientes:editar")
  @ApiOperation({ summary: "Cambiar estado activo/inactivo de un cliente" })
  @ApiParam({ name: "id", example: "c-001" })
  @ApiHeader({ name: HEADER_USUARIO_ID, required: true })
  actualizarEstado(@Param("id") id: string, @Body() dto: ActualizarEstadoDto) {
    return this.clientes.actualizarEstado(id, dto);
  }

  @Delete(":id")
  @RequierePrivilegio("clientes:eliminar")
  @ApiOperation({ summary: "Eliminar definitivamente un cliente" })
  @ApiParam({ name: "id", example: "c-001" })
  @ApiHeader({ name: HEADER_USUARIO_ID, required: true })
  eliminar(@Param("id") id: string) {
    return this.clientes.eliminar(id);
  }
}
