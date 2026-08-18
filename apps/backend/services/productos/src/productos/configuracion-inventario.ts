/**
 * Umbrales con los que el inventario decide qué merece una alerta. Son una
 * política del negocio, no un atributo del producto, así que viven en el
 * entorno y no en la base de datos: cambiarlos no requiere una migración.
 *
 * El resumen del dashboard y las alertas leen esta misma configuración, para
 * que nunca reporten cosas distintas sobre el mismo catálogo.
 */
export interface ConfiguracionInventario {
  /** Existencia igual o menor a este número cuenta como stock bajo. */
  umbralStockBajo: number;
  /** Días de anticipación con los que se avisa de una caducidad. */
  diasAvisoCaducidad: number;
}

const UMBRAL_STOCK_BAJO_POR_DEFECTO = 5;
const DIAS_AVISO_CADUCIDAD_POR_DEFECTO = 14;

/** Lee un entero no negativo del entorno; ante cualquier basura, el valor por defecto. */
function enteroNoNegativo(valor: string | undefined, porDefecto: number): number {
  if (valor === undefined || valor.trim() === "") {
    return porDefecto;
  }
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= 0 ? numero : porDefecto;
}

/** Resuelve los umbrales vigentes a partir de las variables de entorno. */
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
