import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { EstadoCotizacion } from ".prisma/client";

export class PartidaCotizacionRespuestaDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: "p-001" })
  productoId: string;

  @ApiProperty({ example: "Abarrote surtido 1kg" })
  productoNombre: string;

  @ApiProperty({ example: 2 })
  cantidad: number;

  @ApiProperty({ example: 45.5 })
  precioUnitario: number;

  @ApiProperty({ example: 91 })
  importe: number;
}

export class CotizacionRespuestaDto {
  @ApiProperty({ example: "cot-001" })
  id: string;

  @ApiProperty({ example: "COT-000001" })
  folio: string;

  @ApiProperty({ example: "c-001" })
  clienteId: string;

  @ApiProperty({ example: "María González López" })
  clienteNombre: string;

  @ApiProperty({ enum: EstadoCotizacion })
  estado: EstadoCotizacion;

  @ApiProperty({ example: 145 })
  subtotal: number;

  @ApiProperty({ example: 23.2 })

  @ApiProperty({ example: 168.2 })
  total: number;

  @ApiPropertyOptional({ example: "venta-001", nullable: true })
  ventaId: string | null;

  @ApiProperty()
  creadaEn: Date;

  @ApiProperty()
  actualizadaEn: Date;

  @ApiProperty({ type: [PartidaCotizacionRespuestaDto] })
  partidas: PartidaCotizacionRespuestaDto[];
}

export class ResumenCotizacionesRespuestaDto {
  @ApiProperty({ example: 4 })
  borrador: number;

  @ApiProperty({ example: 3 })
  enviadas: number;

  @ApiProperty({ example: 7 })
  vendidas: number;

  @ApiProperty({ example: 14 })
  total: number;

  @ApiProperty({ example: 23450.8 })
  montoVendido: number;
}
