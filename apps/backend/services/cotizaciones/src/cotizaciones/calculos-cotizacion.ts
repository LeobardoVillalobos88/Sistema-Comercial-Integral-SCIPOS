import Decimal from "decimal.js";

export interface PartidaParaCalculo {
  productoId: string;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number | string | Decimal;
}

export interface PartidaCalculada extends Omit<PartidaParaCalculo, "precioUnitario"> {
  precioUnitario: Decimal;
  importe: Decimal;
}

export interface TotalesCotizacion {
  partidas: PartidaCalculada[];
  subtotal: Decimal;
  total: Decimal;
}

const MONEDA_DECIMALES = 2;

export function calcularTotales(partidas: PartidaParaCalculo[]): TotalesCotizacion {
  const partidasCalculadas = partidas.map((partida) => {
    const precioUnitario = new Decimal(partida.precioUnitario).toDecimalPlaces(
      MONEDA_DECIMALES,
      Decimal.ROUND_HALF_UP,
    );
    if (precioUnitario.isNegative()) {
      throw new Error(`El producto ${partida.productoId} tiene un precio inválido`);
    }
    const importe = precioUnitario
      .times(partida.cantidad)
      .toDecimalPlaces(MONEDA_DECIMALES, Decimal.ROUND_HALF_UP);
    return { ...partida, precioUnitario, importe };
  });
  const subtotal = partidasCalculadas
    .reduce((acumulado, partida) => acumulado.plus(partida.importe), new Decimal(0))
    .toDecimalPlaces(MONEDA_DECIMALES, Decimal.ROUND_HALF_UP);
  return { partidas: partidasCalculadas, subtotal, total: subtotal };
}
