import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class IniciarSesionDto {
  @ApiProperty({ example: "admin@scipos.com" })
  @IsEmail({}, { message: "El correo no tiene un formato válido." })
  correo!: string;

  @ApiProperty({ example: "Admin1234" })
  @IsString()
  @MinLength(8, { message: "La contraseña debe tener al menos 8 caracteres." })
  contrasena!: string;
}
