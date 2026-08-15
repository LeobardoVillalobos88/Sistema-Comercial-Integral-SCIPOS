import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, Matches, MinLength } from "class-validator";

export class CrearClienteDto {
  @ApiProperty({ example: "María González López", description: "Nombre completo o razón social" })
  @IsString()
  @MinLength(1, { message: "El nombre es obligatorio." })
  nombre!: string;

  @ApiPropertyOptional({
    example: "GOLM850101AB1",
    description: "RFC del cliente (12 o 13 caracteres con homoclave)",
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z&Ññ]{3,4}\d{6}[A-Z0-9]{3}$/i, {
    message: "RFC inválido (debe tener formato oficial con homoclave de 12 o 13 caracteres).",
  })
  rfc?: string;

  @ApiProperty({ example: "7771234567", description: "Teléfono del cliente (10 dígitos)" })
  @IsString()
  @Matches(/^\d{10}$/, { message: "El teléfono debe contener exactamente 10 dígitos." })
  telefono!: string;

  @ApiProperty({
    example: "maria.gonzalez@correo.com",
    description: "Correo electrónico del cliente",
  })
  @IsEmail({}, { message: "El correo no tiene un formato válido." })
  correo!: string;

  @ApiProperty({
    example: "Av. Morelos 123, Cuernavaca",
    description: "Dirección completa del cliente",
  })
  @IsString()
  @MinLength(1, { message: "La dirección es obligatoria." })
  direccion!: string;
}
