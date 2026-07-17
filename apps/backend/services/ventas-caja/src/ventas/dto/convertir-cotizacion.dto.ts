import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { PartidaVentaDto } from "./partida-venta.dto";

export class ConvertirCotizacionDto {
  @ApiProperty({ example: "cot-001", description: "Cotización que se convierte en venta" })
  @IsString()
  @MinLength(1, { message: "El cotizacionId es obligatorio." })
  cotizacionId!: string;

  @ApiProperty({ example: "c-001" })
  @IsString()
  @MinLength(1, { message: "El clienteId es obligatorio." })
  clienteId!: string;

  @ApiProperty({ type: [PartidaVentaDto], minItems: 1 })
  @IsArray({ message: "Las partidas deben ser un arreglo." })
  @ArrayMinSize(1, { message: "La venta debe incluir al menos una partida." })
  @ValidateNested({ each: true })
  @Type(() => PartidaVentaDto)
  partidas!: PartidaVentaDto[];

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsOptional()
  @IsNumber({}, { message: "El descuento debe ser numérico." })
  @Min(0, { message: "El descuento no puede ser negativo." })
  descuento?: number;
}
