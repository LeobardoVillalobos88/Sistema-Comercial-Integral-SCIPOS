import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { HEADER_USUARIO_ID, RequierePrivilegio, UsuarioActual } from "@scipos/backend-commons";

import { CotizacionesService } from "./cotizaciones.service";
import { CrearCotizacionDto } from "./dto/crear-cotizacion.dto";
import { FiltrarCotizacionesDto } from "./dto/filtrar-cotizaciones.dto";
import { CotizacionRespuestaDto, ResumenCotizacionesRespuestaDto } from "./dto/respuestas.dto";

@ApiTags("cotizaciones")
@ApiHeader({ name: HEADER_USUARIO_ID, required: true, description: "ID del usuario activo" })
@ApiUnauthorizedResponse({ description: "Falta el header x-usuario-id" })
@ApiForbiddenResponse({ description: "El usuario no tiene el privilegio requerido" })
@ApiServiceUnavailableResponse({ description: "No fue posible consultar seguridad" })
@Controller("cotizaciones")
export class CotizacionesController {
  constructor(private readonly cotizaciones: CotizacionesService) {}

  @Post()
  @RequierePrivilegio("cotizaciones:crear")
  @ApiOperation({ summary: "Crea una cotización con precios y totales calculados en servidor" })
  @ApiCreatedResponse({ type: CotizacionRespuestaDto })
  @ApiBadRequestResponse({ description: "Datos de entrada inválidos" })
  crear(
    @Body() dto: CrearCotizacionDto,
    @UsuarioActual() usuarioId: string,
  ): Promise<CotizacionRespuestaDto> {
    return this.cotizaciones.crear(dto, usuarioId);
  }

  @Get()
  @RequierePrivilegio("cotizaciones:ver")
  @ApiOperation({ summary: "Lista y filtra cotizaciones" })
  @ApiOkResponse({ type: [CotizacionRespuestaDto] })
  listar(@Query() filtros: FiltrarCotizacionesDto): Promise<CotizacionRespuestaDto[]> {
    return this.cotizaciones.listar(filtros);
  }

  @Get("resumen")
  @RequierePrivilegio("cotizaciones:ver")
  @ApiOperation({ summary: "Resume cotizaciones por estado para el dashboard" })
  @ApiOkResponse({ type: ResumenCotizacionesRespuestaDto })
  resumen(@Query() filtros: FiltrarCotizacionesDto): Promise<ResumenCotizacionesRespuestaDto> {
    return this.cotizaciones.resumen(filtros);
  }

  @Get("cliente/:clienteId")
  @RequierePrivilegio("cotizaciones:ver")
  @ApiOperation({ summary: "Consulta el historial de cotizaciones de un cliente" })
  @ApiParam({ name: "clienteId", example: "c-001" })
  @ApiOkResponse({ type: [CotizacionRespuestaDto] })
  listarPorCliente(
    @Param("clienteId") clienteId: string,
    @Query() filtros: FiltrarCotizacionesDto,
  ): Promise<CotizacionRespuestaDto[]> {
    return this.cotizaciones.listarPorCliente(clienteId, filtros);
  }

  @Get(":id")
  @RequierePrivilegio("cotizaciones:ver")
  @ApiOperation({ summary: "Obtiene el detalle de una cotización" })
  @ApiOkResponse({ type: CotizacionRespuestaDto })
  @ApiNotFoundResponse({ description: "Cotización inexistente" })
  obtener(@Param("id") id: string): Promise<CotizacionRespuestaDto> {
    return this.cotizaciones.obtener(id);
  }

  @Patch(":id/enviar")
  @RequierePrivilegio("cotizaciones:enviar")
  @ApiOperation({ summary: "Cambia una cotización de BORRADOR a ENVIADA" })
  @ApiOkResponse({ type: CotizacionRespuestaDto })
  @ApiConflictResponse({ description: "La cotización no está en BORRADOR" })
  enviar(@Param("id") id: string): Promise<CotizacionRespuestaDto> {
    return this.cotizaciones.enviar(id);
  }

  @Post(":id/convertir")
  @HttpCode(HttpStatus.OK)
  @RequierePrivilegio("cotizaciones:convertir")
  @ApiOperation({ summary: "Crea una venta y, solo al confirmarla, marca la cotización VENDIDA" })
  @ApiOkResponse({ type: CotizacionRespuestaDto })
  @ApiConflictResponse({ description: "La cotización no está ENVIADA" })
  convertir(
    @Param("id") id: string,
    @UsuarioActual() usuarioId: string,
  ): Promise<CotizacionRespuestaDto> {
    return this.cotizaciones.convertir(id, usuarioId);
  }

  @Delete(":id")
  @RequierePrivilegio("cotizaciones:eliminar")
  @ApiOperation({ summary: "Elimina definitivamente una cotización BORRADOR" })
  @ApiOkResponse({ type: CotizacionRespuestaDto })
  @ApiConflictResponse({ description: "Solo se permite eliminar cotizaciones BORRADOR" })
  eliminar(@Param("id") id: string): Promise<CotizacionRespuestaDto> {
    return this.cotizaciones.eliminar(id);
  }
}
