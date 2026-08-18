import type { ConfiguracionInventario } from "./configuracion-inventario";

export type SeveridadCaducidad = "VENCIDO" | "POR_VENCER";
export type SeveridadStock = "AGOTADO" | "BAJO";

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

export function diasNaturalesEntre(desde: Date, hasta: Date): number {
  const inicio = Date.UTC(desde.getFullYear(), desde.getMonth(), desde.getDate());
  const fin = Date.UTC(hasta.getFullYear(), hasta.getMonth(), hasta.getDate());
  return Math.round((fin - inicio) / MILISEGUNDOS_POR_DIA);
}

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
