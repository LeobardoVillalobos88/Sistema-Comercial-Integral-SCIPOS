import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class CrearUsuarioDto {
  @ApiProperty({ example: "Laura Martínez" })
  @IsString()
  @MinLength(1, { message: "El nombre es obligatorio." })
  nombre!: string;

  @ApiProperty({ example: "laura@scipos.mx" })
  @IsEmail({}, { message: "El correo no tiene un formato válido." })
  correo!: string;

  @ApiProperty({ example: "VENDEDOR", description: "Clave del rol asignado" })
  @IsString()
  @MinLength(1, { message: "El rol es obligatorio." })
  rol!: string;

  @ApiProperty({ example: "Vendedor1234", description: "Contraseña de acceso" })
  @IsString()
  @MinLength(8, { message: "La contraseña debe tener al menos 8 caracteres." })
  contrasena!: string;
}
