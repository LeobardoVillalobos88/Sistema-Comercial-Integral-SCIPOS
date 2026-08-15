import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import { HEADER_USUARIO_ID, RequiereIdentidad, RequierePrivilegio } from "@scipos/backend-commons";
import { CajaService } from "./caja.service";
import { AbrirCajaDto } from "./dto/abrir-caja.dto";
import { RegistrarMovimientoCajaDto } from "./dto/registrar-movimiento.dto";

@ApiTags("caja")
@Controller("caja")
export class CajaController {
  constructor(private readonly caja: CajaService) {}

  @Get("estado")
  @RequiereIdentidad()
  @ApiOperation({
    summary: "Estado del turno de caja actual",
    description:
      "Indica si hay caja abierta y, en su caso, sus movimientos y ventas acumuladas. Cualquier usuario identificado puede consultarlo (el POS lo necesita para saber si puede vender).",
  })
  @ApiHeader({ name: HEADER_USUARIO_ID, required: true })
  estado() {
    return this.caja.estado();
  }

  @Get("cortes")
  @RequiereIdentidad()
  @ApiOperation({
    summary: "Cortes de caja realizados",
    description:
      "Turnos cerrados con su monto inicial y final; lo consume el servicio de reportes.",
  })
  @ApiHeader({ name: HEADER_USUARIO_ID, required: false })
  cortes() {
    return this.caja.listarCortes();
  }

  @Post("abrir")
  @RequierePrivilegio("caja:abrir")
  @ApiOperation({ summary: "Abrir turno de caja" })
  @ApiHeader({ name: HEADER_USUARIO_ID, required: true })
  abrir(@Body() dto: AbrirCajaDto) {
    return this.caja.abrir(dto);
  }

  @Post("movimiento")
  @RequierePrivilegio("caja:movimiento")
  @ApiOperation({ summary: "Registrar ingreso o egreso manual de caja" })
  @ApiHeader({ name: HEADER_USUARIO_ID, required: true })
  registrarMovimiento(@Body() dto: RegistrarMovimientoCajaDto) {
    return this.caja.registrarMovimiento(dto);
  }

  @Post("cerrar")
  @RequierePrivilegio("caja:cerrar")
  @ApiOperation({ summary: "Realizar corte de caja del turno activo" })
  @ApiHeader({ name: HEADER_USUARIO_ID, required: true })
  cerrar() {
    return this.caja.cerrar();
  }
}
