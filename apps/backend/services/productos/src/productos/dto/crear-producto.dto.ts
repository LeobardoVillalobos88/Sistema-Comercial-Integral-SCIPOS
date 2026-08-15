import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsISO8601,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";

const TIPOS_PRODUCTO = ["PRODUCTO", "SERVICIO"] as const;

export class CrearProductoDto {
  @ApiProperty({ example: "ABA-001", description: "Lote o clave del producto." })
  @IsString()
  @MinLength(1, { message: "El lote es obligatorio." })
  lote!: string;

  @ApiProperty({ example: "Abarrote surtido 1kg" })
  @IsString()
  @MinLength(1, { message: "El nombre es obligatorio." })
  nombre!: string;

  @ApiProperty({ enum: TIPOS_PRODUCTO, example: "PRODUCTO" })
  @IsIn(TIPOS_PRODUCTO, { message: "El tipo debe ser PRODUCTO o SERVICIO." })
  tipo!: "PRODUCTO" | "SERVICIO";

  @ApiProperty({ example: 29.5, description: "Precio al que se compra al proveedor." })
  @IsNumber({}, { message: "El precio de compra debe ser numérico." })
  @Min(0, { message: "El precio de compra no puede ser negativo." })
  precioCompra!: number;

  @ApiProperty({ example: 45.5, description: "Precio al que se vende al cliente." })
  @IsNumber({}, { message: "El precio de venta debe ser numérico." })
  @Min(0.01, { message: "El precio de venta debe ser mayor a 0." })
  precioVenta!: number;

  @ApiPropertyOptional({ example: 120, default: 0 })
  @IsOptional()
  @IsInt({ message: "La existencia debe ser un entero." })
  @Min(0, { message: "La existencia no puede ser negativa." })
  existencia?: number;

  @ApiPropertyOptional({ example: "2026-11-30", description: "Fecha ISO de caducidad del lote." })
  @IsOptional()
  @IsISO8601({}, { message: "La fecha de caducidad debe tener formato ISO (aaaa-mm-dd)." })
  fechaCaducidad?: string;
}
