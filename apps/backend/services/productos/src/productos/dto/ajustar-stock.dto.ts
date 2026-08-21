import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsInt, NotEquals } from "class-validator";

const MOTIVOS_AJUSTE = ["VENTA", "COMPRA", "AJUSTE"] as const;

export class AjustarStockDto {
  @ApiProperty({ example: -1, description: "Cantidad a sumar (negativa para restar)." })
  @IsInt({ message: "El delta debe ser un entero." })
  @NotEquals(0, { message: "El delta no puede ser 0." })
  delta!: number;

  @ApiProperty({ enum: MOTIVOS_AJUSTE, example: "VENTA" })
  @IsIn(MOTIVOS_AJUSTE, { message: "El motivo debe ser VENTA, COMPRA o AJUSTE." })
  motivo!: "VENTA" | "COMPRA" | "AJUSTE";
}
