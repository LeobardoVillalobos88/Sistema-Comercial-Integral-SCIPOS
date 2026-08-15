import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, Min } from "class-validator";

export class AbrirCajaDto {
  @ApiProperty({ example: 1000, minimum: 0, description: "Fondo inicial del turno" })
  @IsNumber({}, { message: "El monto inicial debe ser numérico." })
  @Min(0, { message: "El monto inicial no puede ser negativo." })
  montoInicial!: number;
}
