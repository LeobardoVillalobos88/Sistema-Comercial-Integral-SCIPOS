/**
 * Tipos de dominio compartidos por los módulos. Si tu módulo necesita un tipo
 * nuevo y lo van a usar otros, agrégalo aquí para que todos referencien los
 * mismos IDs y los datos embonen entre módulos.
 */

export type TipoProducto = "PRODUCTO" | "SERVICIO";

export interface Producto {
  id: string;
  clave: string;
  nombre: string;
  tipo: TipoProducto;
  precio: number;
  existencia: number;
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

export interface PartidaCotizacion {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
}

export type EstadoCotizacion = "BORRADOR" | "ENVIADA" | "CONVERTIDA";

export interface Cotizacion {
  id: string;
  folio: string;
  clienteId: string;
  fecha: string;
  estado: EstadoCotizacion;
  partidas: PartidaCotizacion[];
}
