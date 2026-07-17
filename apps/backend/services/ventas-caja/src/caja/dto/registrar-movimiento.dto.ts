import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNumber, IsString, Min, MinLength } from "class-validator";

const TIPOS_MOVIMIENTO = ["INGRESO", "EGRESO"] as const;

export class RegistrarMovimientoCajaDto {
  @ApiProperty({ enum: TIPOS_MOVIMIENTO, example: "INGRESO" })
  @IsIn(TIPOS_MOVIMIENTO, { message: "El tipo debe ser INGRESO o EGRESO." })
  tipo!: (typeof TIPOS_MOVIMIENTO)[number];

  @ApiProperty({ example: 150, minimum: 0.01 })
  @IsNumber({}, { message: "El monto debe ser numérico." })
  @Min(0.01, { message: "El monto debe ser mayor a cero." })
  monto!: number;

  @ApiProperty({ example: "Fondo para cambio adicional" })
  @IsString()
  @MinLength(1, { message: "El motivo es obligatorio." })
  motivo!: string;
}
