import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsString, Matches } from "class-validator";

export class AjustarPrivilegioUsuarioDto {
  @ApiProperty({ example: "pos:descuento", description: "Clave con formato modulo:accion" })
  @IsString()
  @Matches(/^[a-z]+:[a-z]+$/, {
    message: 'El privilegio debe tener el formato "modulo:accion" en minúsculas.',
  })
  privilegio!: string;

  @ApiProperty({
    example: false,
    description: "true concede el privilegio; false lo revoca aunque el rol lo tenga",
  })
  @IsBoolean({ message: "El campo concedido debe ser true o false." })
  concedido!: boolean;
}
