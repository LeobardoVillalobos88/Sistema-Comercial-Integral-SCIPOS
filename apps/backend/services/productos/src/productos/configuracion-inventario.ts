export interface ConfiguracionInventario {
  umbralStockBajo: number;
  diasAvisoCaducidad: number;
}

const UMBRAL_STOCK_BAJO_POR_DEFECTO = 5;
const DIAS_AVISO_CADUCIDAD_POR_DEFECTO = 14;

function enteroNoNegativo(valor: string | undefined, porDefecto: number): number {
  if (valor === undefined || valor.trim() === "") {
    return porDefecto;
  }
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= 0 ? numero : porDefecto;
}

export function configuracionInventario(
  entorno: NodeJS.ProcessEnv = process.env,
): ConfiguracionInventario {
  return {
    umbralStockBajo: enteroNoNegativo(entorno.UMBRAL_STOCK_BAJO, UMBRAL_STOCK_BAJO_POR_DEFECTO),
    diasAvisoCaducidad: enteroNoNegativo(
      entorno.DIAS_AVISO_CADUCIDAD,
      DIAS_AVISO_CADUCIDAD_POR_DEFECTO,
    ),
  };
}
