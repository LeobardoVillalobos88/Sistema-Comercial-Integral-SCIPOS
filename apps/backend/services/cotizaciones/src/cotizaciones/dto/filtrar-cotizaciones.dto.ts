import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { EstadoCotizacion } from ".prisma/client";

export class FiltrarCotizacionesDto {
  @ApiPropertyOptional({ enum: EstadoCotizacion })
  @IsOptional()
  @IsEnum(EstadoCotizacion)
  estado?: EstadoCotizacion;

  @ApiPropertyOptional({ example: "c-001" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  clienteId?: string;

  @ApiPropertyOptional({ description: "Busca por folio o nombre del cliente" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  busqueda?: string;

  @ApiPropertyOptional({ example: "2026-07-01" })
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional({ example: "2026-07-31" })
  @IsOptional()
  @IsDateString()
  hasta?: string;
}
