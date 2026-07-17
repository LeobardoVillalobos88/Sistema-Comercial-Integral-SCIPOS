import { Body, Controller, Post } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import { HEADER_USUARIO_ID, RequierePrivilegio } from "@scipos/backend-commons";
import { CajaService } from "./caja.service";
import { AbrirCajaDto } from "./dto/abrir-caja.dto";
import { RegistrarMovimientoCajaDto } from "./dto/registrar-movimiento.dto";

@ApiTags("caja")
@Controller("caja")
export class CajaController {
  constructor(private readonly caja: CajaService) {}

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
