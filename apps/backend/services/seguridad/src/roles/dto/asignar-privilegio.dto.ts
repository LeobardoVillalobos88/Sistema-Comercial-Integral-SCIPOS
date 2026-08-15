import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches } from "class-validator";

export class AsignarPrivilegioDto {
  @ApiProperty({ example: "productos:crear", description: "Clave con formato modulo:accion" })
  @IsString()
  @Matches(/^[a-z]+:[a-z]+$/, {
    message: 'El privilegio debe tener el formato "modulo:accion" en minúsculas.',
  })
  privilegio!: string;
}
