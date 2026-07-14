import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString, MinLength } from "class-validator";

export class ActualizarEjemploDto {
  @ApiPropertyOptional({ example: "Mi ejemplo" })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: "El nombre no puede quedar vacío." })
  nombre?: string;

  @ApiPropertyOptional({ example: "Descripción del ejemplo" })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: "La descripción no puede quedar vacía." })
  descripcion?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: "El campo activo debe ser true o false." })
  activo?: boolean;
}
