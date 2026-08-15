import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class CambiarEstadoProductoDto {
  @ApiProperty({ example: false, description: "true = activo, false = inactivo." })
  @IsBoolean({ message: "El campo activo debe ser true o false." })
  activo!: boolean;
}
