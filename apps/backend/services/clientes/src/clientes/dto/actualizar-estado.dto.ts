import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class ActualizarEstadoDto {
  @ApiProperty({ example: false, description: "Estado activo o inactivo del cliente" })
  @IsBoolean()
  activo!: boolean;
}
