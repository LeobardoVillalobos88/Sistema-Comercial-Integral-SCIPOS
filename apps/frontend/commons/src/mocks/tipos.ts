export type TipoProducto = "PRODUCTO" | "SERVICIO";

export interface Producto {
  id: string;
  lote: string;
  nombre: string;
  tipo: TipoProducto;
  precioCompra: number;
  precioVenta: number;
  existencia: number;
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

export type EstadoCotizacion = "BORRADOR" | "ENVIADA" | "VENDIDA";
