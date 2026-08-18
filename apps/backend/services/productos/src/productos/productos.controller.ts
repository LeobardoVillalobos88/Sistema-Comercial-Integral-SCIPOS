import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { RequiereIdentidad, RequierePrivilegio } from "@scipos/backend-commons";
import { ActualizarProductoDto } from "./dto/actualizar-producto.dto";
import { AjustarStockDto } from "./dto/ajustar-stock.dto";
import { CambiarEstadoProductoDto } from "./dto/cambiar-estado-producto.dto";
import { CrearProductoDto } from "./dto/crear-producto.dto";
import type { FiltrosListado } from "./productos.service";
import { ProductosService } from "./productos.service";

@ApiTags("productos")
@Controller("productos")
export class ProductosController {
  constructor(private readonly productos: ProductosService) {}

  @Get("resumen")
  @RequiereIdentidad()
  @ApiOperation({ summary: "Resumen de productos para el dashboard" })
  resumen() {
    return this.productos.resumen();
  }

  // Debe declararse antes de @Get(":id") o la ruta la absorbería como un id.
  @Get("alertas")
  @RequierePrivilegio("productos:ver")
  @ApiOperation({
    summary: "Alertas de caducidad y de existencias del inventario",
    description:
      "Productos activos vencidos o por vencer, y agotados o por agotarse. Los umbrales " +
      "se configuran por entorno (UMBRAL_STOCK_BAJO, DIAS_AVISO_CADUCIDAD).",
  })
  alertas() {
    return this.productos.alertas();
  }

  @Get()
  @RequierePrivilegio("productos:ver")
  @ApiOperation({ summary: "Listar productos y servicios, con filtros opcionales" })
  @ApiQuery({ name: "estado", required: false, enum: ["ACTIVO", "INACTIVO"] })
  @ApiQuery({ name: "tipo", required: false, enum: ["PRODUCTO", "SERVICIO"] })
  listar(
    @Query("estado") estado?: "ACTIVO" | "INACTIVO",
    @Query("tipo") tipo?: "PRODUCTO" | "SERVICIO",
  ) {
    const filtros: FiltrosListado = { estado, tipo };
    return this.productos.listar(filtros);
  }

  @Get(":id")
  @RequierePrivilegio("productos:ver")
  @ApiOperation({ summary: "Obtener un producto por id" })
  @ApiParam({ name: "id", example: "p-001" })
  obtener(@Param("id") id: string) {
    return this.productos.obtener(id);
  }

  @Post()
  @RequierePrivilegio("productos:crear")
  @ApiOperation({ summary: "Registrar un producto o servicio" })
  crear(@Body() dto: CrearProductoDto) {
    return this.productos.crear(dto);
  }

  @Patch(":id")
  @RequierePrivilegio("productos:editar")
  @ApiOperation({ summary: "Actualizar los datos de un producto" })
  @ApiParam({ name: "id", example: "p-001" })
  actualizar(@Param("id") id: string, @Body() dto: ActualizarProductoDto) {
    return this.productos.actualizar(id, dto);
  }

  @Patch(":id/estado")
  @RequierePrivilegio("productos:desactivar")
  @ApiOperation({ summary: "Activar o desactivar un producto (baja lógica)" })
  @ApiParam({ name: "id", example: "p-001" })
  cambiarEstado(@Param("id") id: string, @Body() dto: CambiarEstadoProductoDto) {
    return this.productos.cambiarEstado(id, dto);
  }

  @Post(":id/stock")
  @RequiereIdentidad()
  @ApiOperation({
    summary: "Ajustar existencias de un producto",
    description:
      "Endpoint de uso interno entre servicios: lo consume ventas-caja para descontar " +
      "stock al vender y reponerlo al cancelar. El privilegio de la acción original " +
      "(pos:vender, pos:cancelar) ya se validó en el servicio que llama.",
  })
  @ApiParam({ name: "id", example: "p-001" })
  ajustarStock(@Param("id") id: string, @Body() dto: AjustarStockDto) {
    return this.productos.ajustarStock(id, dto);
  }

  @Delete(":id")
  @RequierePrivilegio("productos:eliminar")
  @ApiOperation({ summary: "Eliminar definitivamente un producto" })
  @ApiParam({ name: "id", example: "p-001" })
  eliminar(@Param("id") id: string) {
    return this.productos.eliminar(id);
  }
}
