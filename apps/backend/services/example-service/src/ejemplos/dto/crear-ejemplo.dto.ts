import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class CrearEjemploDto {
  @ApiProperty({ example: "Mi ejemplo" })
  @IsString()
  @MinLength(1, { message: "El nombre es obligatorio." })
  nombre!: string;

  @ApiProperty({ example: "Descripción del ejemplo" })
  @IsString()
  @MinLength(1, { message: "La descripción es obligatoria." })
  descripcion!: string;
}
