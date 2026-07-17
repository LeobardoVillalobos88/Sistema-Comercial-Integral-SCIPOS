import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNumber, IsString, Min, MinLength } from "class-validator";

export class PartidaVentaDto {
  @ApiProperty({ example: "p-002", description: "ID del producto vendido" })
  @IsString()
  @MinLength(1, { message: "El productoId es obligatorio." })
  productoId!: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt({ message: "La cantidad debe ser un entero." })
  @Min(1, { message: "La cantidad debe ser al menos 1." })
  cantidad!: number;

  @ApiProperty({ example: 18, minimum: 0 })
  @IsNumber({}, { message: "El precio de venta debe ser numérico." })
  @Min(0, { message: "El precio de venta no puede ser negativo." })
  precioVenta!: number;
}
