import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString, Min, MinLength } from "class-validator";

/**
 * Partida de una venta. El precio no viaja en la petición: el servicio lo
 * lee del catálogo de productos para que el importe cobrado no dependa de
 * lo que mande el cliente.
 */
export class PartidaVentaDto {
  @ApiProperty({ example: "p-002", description: "ID del producto vendido" })
  @IsString()
  @MinLength(1, { message: "El productoId es obligatorio." })
  productoId!: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt({ message: "La cantidad debe ser un entero." })
  @Min(1, { message: "La cantidad debe ser al menos 1." })
  cantidad!: number;
}
