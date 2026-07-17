/** Tasa de IVA aplicada en el POS (16%). */
export const TASA_IVA = 0.16;

export interface PartidaCalculada {
  productoId: string;
  cantidad: number;
  precioVenta: number;
  subtotal: number;
}

export interface TotalesVenta {
  subtotal: number;
  descuentoEfectivo: number;
  iva: number;
  total: number;
  partidas: PartidaCalculada[];
}

/** Redondea montos a dos decimales para evitar errores de punto flotante. */
export function redondearMoneda(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Calcula subtotal por partida, descuento efectivo, IVA y total en el backend
 * con la misma regla que el frontend del POS.
 */
export function calcularTotalesVenta(
  partidasEntrada: Array<{ productoId: string; cantidad: number; precioVenta: number }>,
  descuentoSolicitado = 0,
): TotalesVenta {
  const partidas = partidasEntrada.map((partida) => ({
    productoId: partida.productoId,
    cantidad: partida.cantidad,
    precioVenta: partida.precioVenta,
    subtotal: redondearMoneda(partida.cantidad * partida.precioVenta),
  }));

  const subtotal = redondearMoneda(
    partidas.reduce((acumulado, partida) => acumulado + partida.subtotal, 0),
  );
  const descuentoEfectivo = redondearMoneda(Math.min(Math.max(descuentoSolicitado, 0), subtotal));
  const baseGravable = redondearMoneda(Math.max(subtotal - descuentoEfectivo, 0));
  const iva = redondearMoneda(baseGravable * TASA_IVA);
  const total = redondearMoneda(baseGravable + iva);

  return { subtotal, descuentoEfectivo, iva, total, partidas };
}
