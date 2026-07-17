import { Body, Controller, Get, Headers, Param, Post, Query } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { HEADER_USUARIO_ID, RequiereIdentidad, RequierePrivilegio } from "@scipos/backend-commons";
import { ConvertirCotizacionDto } from "./dto/convertir-cotizacion.dto";
import { CrearVentaDto } from "./dto/crear-venta.dto";
import { VentasService } from "./ventas.service";

@ApiTags("ventas")
@Controller("ventas")
export class VentasController {
  constructor(private readonly ventas: VentasService) {}

  @Get("historial")
  @RequiereIdentidad()
  @ApiOperation({ summary: "Historial de ventas filtrado por cliente" })
  @ApiQuery({ name: "clienteId", required: true, example: "c-001" })
  @ApiHeader({ name: HEADER_USUARIO_ID, required: true })
  historial(@Query("clienteId") clienteId: string) {
    return this.ventas.historialPorCliente(clienteId);
  }

  @Post("convertir-cotizacion")
  @RequiereIdentidad()
  @ApiOperation({ summary: "Crear venta a partir de una cotización convertida" })
  @ApiHeader({ name: HEADER_USUARIO_ID, required: true })
  convertirCotizacion(
    @Body() dto: ConvertirCotizacionDto,
    @Headers(HEADER_USUARIO_ID) usuarioId: string,
  ) {
    return this.ventas.convertirCotizacion(dto, usuarioId);
  }

  @Get()
  @RequiereIdentidad()
  @ApiOperation({
    summary: "Listar ventas por cliente",
    description: "Alias consumido por el servicio de clientes al armar el historial.",
  })
  @ApiQuery({ name: "clienteId", required: true, example: "c-001" })
  @ApiHeader({ name: HEADER_USUARIO_ID, required: true })
  listarPorCliente(@Query("clienteId") clienteId: string) {
    return this.ventas.historialPorCliente(clienteId);
  }

  @Post()
  @RequierePrivilegio("pos:vender")
  @ApiOperation({ summary: "Registrar una venta en el POS" })
  @ApiHeader({ name: HEADER_USUARIO_ID, required: true })
  crear(@Body() dto: CrearVentaDto, @Headers(HEADER_USUARIO_ID) usuarioId: string) {
    return this.ventas.crear(dto, usuarioId);
  }

  @Post(":id/cancelar")
  @RequierePrivilegio("pos:cancelar")
  @ApiOperation({ summary: "Cancelar una venta y reponer stock" })
  @ApiParam({ name: "id", example: "VTA-HIST-001" })
  @ApiHeader({ name: HEADER_USUARIO_ID, required: true })
  cancelar(@Param("id") id: string, @Headers(HEADER_USUARIO_ID) usuarioId: string) {
    return this.ventas.cancelar(id, usuarioId);
  }
}
