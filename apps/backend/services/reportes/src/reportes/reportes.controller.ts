import { BadRequestException, Controller, Get, Param, Query, Res } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiParam, ApiProduces, ApiQuery, ApiTags } from "@nestjs/swagger";
import { HEADER_USUARIO_ID, RequierePrivilegio, UsuarioActual } from "@scipos/backend-commons";
import { TIPOS_EXPORTABLES, esTipoExportable } from "./csv";
import { ReportesService } from "./reportes.service";

/** Forma mínima de la respuesta HTTP que necesita la descarga del archivo. */
interface RespuestaDescarga {
  setHeader: (nombre: string, valor: string) => void;
  send: (cuerpo: string) => void;
}

/**
 * Consultar reportes exige reportes:ver (RF-31). Dos acciones se separan del
 * resto porque el enunciado las trata como privilegios propios: la utilidad,
 * reservada a supervisión y administración (RF-33), y la descarga de archivos,
 * que puede sacar información del sistema y por eso no viaja con la consulta.
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
  @RequierePrivilegio("reportes:utilidad")
  @ApiOperation({
    summary: "Utilidad bruta del periodo",
    description:
      "Ingresos menos costo de ventas y descuentos (RF-33). Exige su propio privilegio: ver los reportes comerciales no alcanza para conocer el margen del negocio.",
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

  @Get("exportar/:tipo")
  @RequierePrivilegio("reportes:exportar")
  @ApiOperation({
    summary: "Descargar un reporte en archivo CSV",
    description:
      "El archivo se arma en el servidor, no en el navegador, para que la descarga pase por el guard de privilegios (RF-30).",
  })
  @ApiParam({ name: "tipo", enum: TIPOS_EXPORTABLES })
  @ApiQuery({ name: "desde", required: false, example: "2026-07-01" })
  @ApiQuery({ name: "hasta", required: false, example: "2026-07-31" })
  @ApiProduces("text/csv")
  async exportar(
    @Param("tipo") tipo: string,
    @UsuarioActual() usuarioId: string,
    @Res() res: RespuestaDescarga,
    @Query("desde") desde?: string,
    @Query("hasta") hasta?: string,
  ) {
    if (!esTipoExportable(tipo)) {
      throw new BadRequestException(
        `Reporte "${tipo}" no exportable. Disponibles: ${TIPOS_EXPORTABLES.join(", ")}.`,
      );
    }
    const archivo = await this.reportes.exportar(tipo, { desde, hasta }, usuarioId);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${archivo.nombre}"`);
    res.send(archivo.contenido);
  }
}
