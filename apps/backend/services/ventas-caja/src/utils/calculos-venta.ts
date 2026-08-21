export interface PartidaCalculada {
  productoId: string;
  cantidad: number;
  precioVenta: number;
  subtotal: number;
}

export interface TotalesVenta {
  subtotal: number;
  descuentoEfectivo: number;
  total: number;
  partidas: PartidaCalculada[];
}

export function redondearMoneda(valor: number): number {
  return Math.round(valor * 100) / 100;
}

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
  const total = redondearMoneda(Math.max(subtotal - descuentoEfectivo, 0));

  return { subtotal, descuentoEfectivo, total, partidas };
}
