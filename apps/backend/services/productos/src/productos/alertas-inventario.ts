import type { ConfiguracionInventario } from "./configuracion-inventario";

/**
 * Clasificación de las alertas del inventario. Es un módulo puro: recibe los
 * productos ya consultados y devuelve los grupos, sin tocar Prisma, Redis ni
 * Nest. Así la regla que decide qué es urgente se puede probar sola.
 */

export type SeveridadCaducidad = "VENCIDO" | "POR_VENCER";
export type SeveridadStock = "AGOTADO" | "BAJO";

/** Lo que la clasificación necesita saber de un producto. */
export interface ProductoInventario {
  id: string;
  nombre: string;
  lote: string;
  tipo: string;
  existencia: number;
  fechaCaducidad: Date | null;
  activo: boolean;
}

export interface AlertaCaducidad {
  id: string;
  nombre: string;
  lote: string;
  fechaCaducidad: Date;
  /** Días que faltan para vencer. Negativo si el lote ya venció. */
  diasRestantes: number;
  severidad: SeveridadCaducidad;
}

export interface AlertaStock {
  id: string;
  nombre: string;
  lote: string;
  existencia: number;
  severidad: SeveridadStock;
}

export interface AlertasInventario {
  generadoEn: Date;
  umbrales: { stockBajo: number; diasCaducidad: number };
  total: number;
  caducidad: AlertaCaducidad[];
  stock: AlertaStock[];
}

const MILISEGUNDOS_POR_DIA = 86_400_000;

/**
 * Días naturales entre dos fechas, ignorando la hora: un lote que vence hoy
 * a las 23:00 vence "hoy", no "en cero horas".
 */
export function diasNaturalesEntre(desde: Date, hasta: Date): number {
  const inicio = Date.UTC(desde.getFullYear(), desde.getMonth(), desde.getDate());
  const fin = Date.UTC(hasta.getFullYear(), hasta.getMonth(), hasta.getDate());
  return Math.round((fin - inicio) / MILISEGUNDOS_POR_DIA);
}

/**
 * Reparte los productos en las alertas que merecen. Solo entran los activos;
 * las existencias solo aplican a tipo PRODUCTO, porque un servicio no tiene
 * inventario que se acabe.
 *
 * Cada grupo sale ordenado de más urgente a menos: lo ya vencido antes que lo
 * que está por vencer, y lo agotado antes que lo escaso.
 */
export function calcularAlertas(
  productos: ProductoInventario[],
  configuracion: ConfiguracionInventario,
  referencia: Date = new Date(),
): AlertasInventario {
  const activos = productos.filter((producto) => producto.activo);

  const caducidad: AlertaCaducidad[] = [];
  const stock: AlertaStock[] = [];

  for (const producto of activos) {
    if (producto.fechaCaducidad) {
      const diasRestantes = diasNaturalesEntre(referencia, producto.fechaCaducidad);
      if (diasRestantes <= configuracion.diasAvisoCaducidad) {
        caducidad.push({
          id: producto.id,
          nombre: producto.nombre,
          lote: producto.lote,
          fechaCaducidad: producto.fechaCaducidad,
          diasRestantes,
          severidad: diasRestantes < 0 ? "VENCIDO" : "POR_VENCER",
        });
      }
    }

    if (producto.tipo === "PRODUCTO" && producto.existencia <= configuracion.umbralStockBajo) {
      stock.push({
        id: producto.id,
        nombre: producto.nombre,
        lote: producto.lote,
        existencia: producto.existencia,
        severidad: producto.existencia <= 0 ? "AGOTADO" : "BAJO",
      });
    }
  }

  // Ordenar por el número basta para que la severidad quede en orden: lo
  // vencido tiene días negativos, y lo agotado, existencia cero.
  caducidad.sort(
    (a, b) => a.diasRestantes - b.diasRestantes || a.nombre.localeCompare(b.nombre, "es"),
  );
  stock.sort((a, b) => a.existencia - b.existencia || a.nombre.localeCompare(b.nombre, "es"));

  return {
    generadoEn: referencia,
    umbrales: {
      stockBajo: configuracion.umbralStockBajo,
      diasCaducidad: configuracion.diasAvisoCaducidad,
    },
    total: caducidad.length + stock.length,
    caducidad,
    stock,
  };
}
