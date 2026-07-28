export interface ProductoPos {
  id: string;
  clave: string;
  nombre: string;
  precioCompra: number;
  precioVenta: number;
  existencia: number;
  estado: "Activo" | "Inactivo";
}

/** "venta" usa el precio de venta y resta inventario; "compra" usa el precio de compra y suma. */
export type ModoPos = "venta" | "compra";

export interface ItemCarrito {
  productoId: string;
  clave: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
}

export type TipoMovimientoCajaUi = "Ingreso" | "Egreso";

export interface MovimientoCaja {
  id: string;
  concepto: string;
  monto: number;
  tipo: TipoMovimientoCajaUi;
  fecha: string;
}

export interface VentaPOS {
  id: string;
  folio: string;
  fecha: string;
  items: ItemCarrito[];
  subtotal: number;
  descuento: number;
  iva: number;
  total: number;
}

export interface CorteCaja {
  id: string;
  folio: string;
  fechaApertura: string;
  fechaCierre: string;
  montoInicial: number;
  ventasTurno: number;
  ingresosManual: number;
  egresosManual: number;
  totalCierre: number;
  responsable: string;
}
