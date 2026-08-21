import type { Prisma } from ".prisma/client";

import type { CotizacionRespuestaDto } from "./dto/respuestas.dto";

export type CotizacionConPartidas = Prisma.CotizacionGetPayload<{
  include: { partidas: true };
}>;

export function mapearCotizacion(cotizacion: CotizacionConPartidas): CotizacionRespuestaDto {
  return {
    id: cotizacion.id,
    folio: cotizacion.folio,
    clienteId: cotizacion.clienteId,
    clienteNombre: cotizacion.clienteNombre,
    estado: cotizacion.estado,
    subtotal: cotizacion.subtotal.toNumber(),
    total: cotizacion.total.toNumber(),
    ventaId: cotizacion.ventaId,
    creadaEn: cotizacion.creadaEn,
    actualizadaEn: cotizacion.actualizadaEn,
    partidas: cotizacion.partidas.map((partida) => ({
      id: partida.id,
      productoId: partida.productoId,
      productoNombre: partida.productoNombre,
      cantidad: partida.cantidad,
      precioUnitario: partida.precioUnitario.toNumber(),
      importe: partida.importe.toNumber(),
    })),
  };
}
