import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { RequierePrivilegio } from "@scipos/backend-commons";
import { ComprasService } from "./compras.service";
import { CrearCompraDto } from "./dto/crear-compra.dto";

@ApiTags("compras")
@Controller("compras")
export class ComprasController {
  constructor(private readonly compras: ComprasService) {}

  @Get()
  @RequierePrivilegio("compras:ver")
  @ApiOperation({
    summary: "Historial de compras a proveedores",
    description:
      "De la más reciente a la más antigua, con el proveedor y las partidas ya resueltas a nombre de producto.",
  })
  @ApiQuery({ name: "desde", required: false, example: "2026-08-01" })
  @ApiQuery({ name: "hasta", required: false, example: "2026-08-31" })
  listar(@Query("desde") desde?: string, @Query("hasta") hasta?: string) {
    return this.compras.listar({ desde, hasta });
  }

  @Post()
  @RequierePrivilegio("compras:ver")
  @ApiOperation({ summary: "Registrar una compra a proveedor e incrementar existencias" })
  crear(@Body() dto: CrearCompraDto) {
    return this.compras.crear(dto);
  }
}
