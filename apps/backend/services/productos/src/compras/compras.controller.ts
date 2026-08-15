import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { RequierePrivilegio } from "@scipos/backend-commons";
import { ComprasService } from "./compras.service";
import { CrearCompraDto } from "./dto/crear-compra.dto";

@ApiTags("compras")
@Controller("compras")
export class ComprasController {
  constructor(private readonly compras: ComprasService) {}

  @Post()
  @RequierePrivilegio("compras:ver")
  @ApiOperation({ summary: "Registrar una compra a proveedor e incrementar existencias" })
  crear(@Body() dto: CrearCompraDto) {
    return this.compras.crear(dto);
  }
}
