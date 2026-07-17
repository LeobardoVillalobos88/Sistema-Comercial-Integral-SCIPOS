/**
 * Tipos de dominio compartidos por los módulos. Si tu módulo necesita un tipo
 * nuevo y lo van a usar otros, agrégalo aquí para que todos referencien los
 * mismos IDs y los datos embonen entre módulos.
 */

export type TipoProducto = "PRODUCTO" | "SERVICIO";

export interface Producto {
  id: string;
  lote: string;
  nombre: string;
  tipo: TipoProducto;
  /** Precio al que se compra el producto (a proveedor). */
  precioCompra: number;
  /** Precio al que se vende el producto (a cliente). */
  precioVenta: number;
  existencia: number;
  /** Fecha ISO de caducidad del lote. Opcional (servicios no caducan). */
  fechaCaducidad?: string;
  activo: boolean;
}

export interface Cliente {
  id: string;
  nombre: string;
  rfc?: string;
  telefono: string;
  correo: string;
  direccion: string;
  activo: boolean;
}

/** Estados del ciclo de vida de una cotización (RF-13→17). */
export type EstadoCotizacion = "BORRADOR" | "ENVIADA" | "VENDIDA";
