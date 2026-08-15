import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class RefrescarDto {
  @ApiProperty({
    description: "Refresh token entregado al iniciar sesión o en el refresh anterior.",
  })
  @IsString()
  @MinLength(1, { message: "El refresh token es obligatorio." })
  refreshToken!: string;
}
