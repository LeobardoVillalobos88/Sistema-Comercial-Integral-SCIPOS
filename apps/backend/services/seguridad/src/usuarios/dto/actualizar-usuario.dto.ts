import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from "class-validator";

export class ActualizarUsuarioDto {
  @ApiPropertyOptional({ example: "Laura Martínez" })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: "El nombre no puede quedar vacío." })
  nombre?: string;

  @ApiPropertyOptional({ example: "laura@scipos.mx" })
  @IsOptional()
  @IsEmail({}, { message: "El correo no tiene un formato válido." })
  correo?: string;

  @ApiPropertyOptional({ example: "SUPERVISOR", description: "Clave del rol asignado" })
  @IsOptional()
  @IsString()
  rol?: string;

  @ApiPropertyOptional({ example: "ACTIVO", enum: ["ACTIVO", "INACTIVO"] })
  @IsOptional()
  @IsIn(["ACTIVO", "INACTIVO"], { message: "El estado debe ser ACTIVO o INACTIVO." })
  estado?: "ACTIVO" | "INACTIVO";

  @ApiPropertyOptional({ example: "NuevaClave1234", description: "Nueva contraseña de acceso" })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: "La contraseña debe tener al menos 8 caracteres." })
  contrasena?: string;
}
