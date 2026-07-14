import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, MinLength } from "class-validator";

export class CrearPrivilegioDto {
  @ApiProperty({ example: "compras:crear", description: "Clave con formato modulo:accion" })
  @IsString()
  @Matches(/^[a-z]+:[a-z]+$/, {
    message: 'La clave debe tener el formato "modulo:accion" en minúsculas.',
  })
  clave!: string;

  @ApiProperty({ example: "Registrar compras a proveedores" })
  @IsString()
  @MinLength(1, { message: "La descripción es obligatoria." })
  descripcion!: string;
}
