import { ApiPropertyOptional } from "@nestjs/swagger";
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

export class ActualizarProductoDto {
  @ApiPropertyOptional({ example: "ABA-001" })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: "El lote no puede quedar vacío." })
  lote?: string;

  @ApiPropertyOptional({ example: "Abarrote surtido 1kg" })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: "El nombre no puede quedar vacío." })
  nombre?: string;

  @ApiPropertyOptional({ enum: TIPOS_PRODUCTO, example: "PRODUCTO" })
  @IsOptional()
  @IsIn(TIPOS_PRODUCTO, { message: "El tipo debe ser PRODUCTO o SERVICIO." })
  tipo?: "PRODUCTO" | "SERVICIO";

  @ApiPropertyOptional({ example: 29.5 })
  @IsOptional()
  @IsNumber({}, { message: "El precio de compra debe ser numérico." })
  @Min(0, { message: "El precio de compra no puede ser negativo." })
  precioCompra?: number;

  @ApiPropertyOptional({ example: 45.5 })
  @IsOptional()
  @IsNumber({}, { message: "El precio de venta debe ser numérico." })
  @Min(0.01, { message: "El precio de venta debe ser mayor a 0." })
  precioVenta?: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsInt({ message: "La existencia debe ser un entero." })
  @Min(0, { message: "La existencia no puede ser negativa." })
  existencia?: number;

  @ApiPropertyOptional({ example: "2026-11-30", nullable: true })
  @IsOptional()
  @IsISO8601({}, { message: "La fecha de caducidad debe tener formato ISO (aaaa-mm-dd)." })
  fechaCaducidad?: string;
}
