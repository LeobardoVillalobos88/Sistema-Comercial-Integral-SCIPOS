import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

export class CrearPartidaCotizacionDto {
  @ApiProperty({ example: "p-001" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  productoId: string;

  @ApiProperty({ example: 2, minimum: 1, maximum: 9999 })
  @IsInt()
  @Min(1)
  @Max(9999)
  cantidad: number;
}

export class CrearCotizacionDto {
  @ApiProperty({ example: "c-001" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  clienteId: string;

  @ApiProperty({ type: [CrearPartidaCotizacionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique((partida: CrearPartidaCotizacionDto) => partida.productoId)
  @ValidateNested({ each: true })
  @Type(() => CrearPartidaCotizacionDto)
  partidas: CrearPartidaCotizacionDto[];
}
