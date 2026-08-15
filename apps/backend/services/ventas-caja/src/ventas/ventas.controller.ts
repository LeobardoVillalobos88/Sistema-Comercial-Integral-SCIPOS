import { Body, Controller, Get, Param, Post, Query, Res } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiParam, ApiProduces, ApiQuery, ApiTags } from "@nestjs/swagger";
import {
  HEADER_USUARIO_ID,
  RequiereIdentidad,
  RequierePrivilegio,
  UsuarioActual,
} from "@scipos/backend-commons";
import { ComprobantesService } from "./comprobantes.service";
import { ConvertirCotizacionDto } from "./dto/convertir-cotizacion.dto";
import { CrearVentaDto } from "./dto/crear-venta.dto";
import { VentasService } from "./ventas.service";

interface RespuestaBinaria {
  setHeader: (nombre: string, valor: string) => void;
  send: (cuerpo: Buffer) => void;
}

@ApiTags("ventas")
@Controller("ventas")
export class VentasController {
  constructor(
    private readonly ventas: VentasService,
    private readonly comprobantes: ComprobantesService,
  ) {}

  @Get("historial")
  @RequiereIdentidad()
  @ApiOperation({ summary: "Historial de ventas filtrado por cliente" })
  @ApiQuery({ name: "clienteId", required: true, example: "c-001" })
  @ApiHeader({ name: HEADER_USUARIO_ID, required: true })
  historial(@Query("clienteId") clienteId: string) {
    return this.ventas.historialPorCliente(clienteId);
  }

  @Get("resumen")
  @RequiereIdentidad()
  @ApiOperation({ summary: "Resumen de ventas del día y estado de caja para el dashboard" })
  @ApiHeader({ name: HEADER_USUARIO_ID, required: true })
  resumen() {
    return this.ventas.resumen();
  }

  @Post("convertir-cotizacion")
  @RequiereIdentidad()
  @ApiOperation({ summary: "Crear venta a partir de una cotización convertida" })
  @ApiHeader({ name: HEADER_USUARIO_ID, required: true })
  convertirCotizacion(@Body() dto: ConvertirCotizacionDto, @UsuarioActual() usuarioId: string) {
    return this.ventas.convertirCotizacion(dto, usuarioId);
  }

  @Get()
  @RequiereIdentidad()
  @ApiOperation({
    summary: "Listar ventas con filtros opcionales",
    description:
      "Lo consumen el servicio de clientes (historial por cliente) y el de reportes (rango de fechas).",
  })
  @ApiQuery({ name: "clienteId", required: false, example: "c-001" })
  @ApiQuery({ name: "desde", required: false, example: "2026-07-01" })
  @ApiQuery({ name: "hasta", required: false, example: "2026-07-31" })
  @ApiHeader({ name: HEADER_USUARIO_ID, required: false })
  listar(
    @Query("clienteId") clienteId?: string,
    @Query("desde") desde?: string,
    @Query("hasta") hasta?: string,
  ) {
    return this.ventas.listar({ clienteId, desde, hasta });
  }

  @Post()
  @RequierePrivilegio("pos:vender")
  @ApiOperation({ summary: "Registrar una venta en el POS" })
  @ApiHeader({ name: HEADER_USUARIO_ID, required: true })
  crear(@Body() dto: CrearVentaDto, @UsuarioActual() usuarioId: string) {
    return this.ventas.crear(dto, usuarioId);
  }

  @Get(":id/comprobante")
  @RequierePrivilegio("pos:ver")
  @ApiOperation({
    summary: "Comprobante PDF no fiscal de una venta",
    description: "Documento con folio, fecha, cliente, partidas y totales (RF-27, RF-28, RF-29).",
  })
  @ApiParam({ name: "id", example: "VTA-HIST-001" })
  @ApiProduces("application/pdf")
  @ApiHeader({ name: HEADER_USUARIO_ID, required: false })
  async comprobante(
    @Param("id") id: string,
    @UsuarioActual() usuarioId: string,
    @Res() res: RespuestaBinaria,
  ) {
    const pdf = await this.comprobantes.generar(id, usuarioId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="comprobante-${id}.pdf"`);
    res.send(pdf);
  }

  @Post(":id/cancelar")
  @RequierePrivilegio("pos:cancelar")
  @ApiOperation({ summary: "Cancelar una venta y reponer stock" })
  @ApiParam({ name: "id", example: "VTA-HIST-001" })
  @ApiHeader({ name: HEADER_USUARIO_ID, required: true })
  cancelar(@Param("id") id: string, @UsuarioActual() usuarioId: string) {
    return this.ventas.cancelar(id, usuarioId);
  }
}
