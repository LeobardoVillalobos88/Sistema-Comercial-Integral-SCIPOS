import { Controller, Get, Query } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { HEADER_USUARIO_ID, RequierePrivilegio, UsuarioActual } from "@scipos/backend-commons";
import { ReportesService } from "./reportes.service";

/**
 * Todos los reportes exigen el privilegio reportes:ver (RF-31); la utilidad
 * queda así restringida a supervisores y administradores (RF-33).
 */
@ApiTags("reportes")
@ApiHeader({ name: HEADER_USUARIO_ID, required: false })
@Controller("reportes")
export class ReportesController {
  constructor(private readonly reportes: ReportesService) {}

  @Get("ventas")
  @RequierePrivilegio("reportes:ver")
  @ApiOperation({ summary: "Reporte de ventas del periodo" })
  @ApiQuery({ name: "desde", required: false, example: "2026-07-01" })
  @ApiQuery({ name: "hasta", required: false, example: "2026-07-31" })
  ventas(
    @UsuarioActual() usuarioId: string,
    @Query("desde") desde?: string,
    @Query("hasta") hasta?: string,
  ) {
    return this.reportes.ventas({ desde, hasta }, usuarioId);
  }

  @Get("cotizaciones")
  @RequierePrivilegio("reportes:ver")
  @ApiOperation({ summary: "Reporte de cotizaciones del periodo" })
  @ApiQuery({ name: "desde", required: false, example: "2026-07-01" })
  @ApiQuery({ name: "hasta", required: false, example: "2026-07-31" })
  cotizaciones(
    @UsuarioActual() usuarioId: string,
    @Query("desde") desde?: string,
    @Query("hasta") hasta?: string,
  ) {
    return this.reportes.cotizaciones({ desde, hasta }, usuarioId);
  }

  @Get("productos")
  @RequierePrivilegio("reportes:ver")
  @ApiOperation({ summary: "Reporte de inventario valuado" })
  productos(@UsuarioActual() usuarioId: string) {
    return this.reportes.productos(usuarioId);
  }

  @Get("cortes")
  @RequierePrivilegio("reportes:ver")
  @ApiOperation({ summary: "Reporte de cortes de caja" })
  cortes(@UsuarioActual() usuarioId: string) {
    return this.reportes.cortes(usuarioId);
  }

  @Get("utilidad")
  @RequierePrivilegio("reportes:ver")
  @ApiOperation({
    summary: "Utilidad bruta del periodo",
    description:
      "Ingresos menos costo de ventas y descuentos (solo supervisores y administradores).",
  })
  @ApiQuery({ name: "desde", required: false, example: "2026-07-01" })
  @ApiQuery({ name: "hasta", required: false, example: "2026-07-31" })
  utilidad(
    @UsuarioActual() usuarioId: string,
    @Query("desde") desde?: string,
    @Query("hasta") hasta?: string,
  ) {
    return this.reportes.utilidad({ desde, hasta }, usuarioId);
  }
}
