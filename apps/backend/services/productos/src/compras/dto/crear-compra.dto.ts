import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

export class PartidaCompraDto {
  @ApiProperty({ example: "p-001" })
  @IsString()
  @MinLength(1, { message: "El producto de la partida es obligatorio." })
  productoId!: string;

  @ApiProperty({ example: 50 })
  @IsInt({ message: "La cantidad debe ser un entero." })
  @Min(1, { message: "La cantidad debe ser al menos 1." })
  cantidad!: number;

  @ApiPropertyOptional({
    example: 29.5,
    description:
      "Precio pagado en esta compra. Si se omite, usa el precioCompra vigente del producto.",
  })
  @IsOptional()
  @IsNumber({}, { message: "El precio de compra debe ser numérico." })
  @Min(0, { message: "El precio de compra no puede ser negativo." })
  precioCompra?: number;
}

export class CrearCompraDto {
  @ApiPropertyOptional({ example: "Proveedor Central S.A." })
  @IsOptional()
  @IsString()
  proveedor?: string;

  @ApiProperty({ type: [PartidaCompraDto] })
  @IsArray()
  @ArrayMinSize(1, { message: "La compra debe tener al menos una partida." })
  @ValidateNested({ each: true })
  @Type(() => PartidaCompraDto)
  partidas!: PartidaCompraDto[];
}
