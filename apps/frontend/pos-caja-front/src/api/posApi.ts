import {
  type Cliente,
  ErrorApi,
  type Producto,
  descargarArchivo,
  llamarApi,
} from "@scipos/frontend-commons";
import type {
  CorteCaja,
  ItemCarrito,
  MovimientoCaja,
  ProductoPos,
  TipoMovimientoCajaUi,
  VentaPOS,
} from "../types/pos";

export interface PartidaVentaApi {
  id: string;
  productoId: string;
  cantidad: number;
  precioVenta: number;
  subtotal: number;
}

export interface VentaDetalleApi {
  id: string;
  cajaId: string;
  clienteId: string;
  cotizacionId?: string | null;
  subtotal: number;
  descuento: number;
  iva: number;
  total: number;
  estado: "COMPLETA" | "CANCELADA";
  fecha: string;
  partidas: PartidaVentaApi[];
}

export interface CajaApi {
  id: string;
  montoInicial: number;
  montoFinal: number | null;
  fechaApertura: string;
  fechaCierre: string | null;
  estado: "ABIERTA" | "CERRADA";
}

export interface MovimientoCajaApi {
  id: string;
  cajaId: string;
  tipo: "INGRESO" | "EGRESO";
  monto: number;
  motivo: string;
  fecha: string;
}

export interface ResumenCorteApi {
  caja: CajaApi;
  ventasTurno: number;
  ingresosManual: number;
  egresosManual: number;
  totalCierre: number;
}

export interface CrearVentaPayload {
  clienteId: string;
  partidas: Array<{
    productoId: string;
    cantidad: number;
  }>;
  descuento?: number;
}

export interface EstadoCajaApi {
  abierta: boolean;
  caja: CajaApi | null;
  movimientos: MovimientoCajaApi[];
  ventasTurno: number;
}

export interface CrearCompraPayload {
  proveedor?: string;
  partidas: Array<{
    productoId: string;
    cantidad: number;
    precioCompra?: number;
  }>;
}

export function mensajeErrorApi(error: unknown, mensajePorDefecto: string): string {
  return error instanceof ErrorApi ? error.message : mensajePorDefecto;
}

export function productoApiAPos(producto: Producto): ProductoPos {
  return {
    id: producto.id,
    clave: producto.lote,
    nombre: producto.nombre,
    precioCompra: producto.precioCompra,
    precioVenta: producto.precioVenta,
    existencia: producto.existencia,
    estado: producto.activo ? "Activo" : "Inactivo",
  };
}

export function movimientoApiAUi(movimiento: MovimientoCajaApi): MovimientoCaja {
  const tipo: TipoMovimientoCajaUi = movimiento.tipo === "INGRESO" ? "Ingreso" : "Egreso";
  return {
    id: movimiento.id,
    concepto: movimiento.motivo,
    monto: movimiento.monto,
    tipo,
    fecha: movimiento.fecha,
  };
}

export function ventaApiAUi(venta: VentaDetalleApi, inventario: ProductoPos[]): VentaPOS {
  const items: ItemCarrito[] = venta.partidas.map((partida) => {
    const producto = inventario.find((item) => item.id === partida.productoId);
    return {
      productoId: partida.productoId,
      clave: producto?.clave ?? partida.productoId,
      nombre: producto?.nombre ?? partida.productoId,
      precioUnitario: partida.precioVenta,
      cantidad: partida.cantidad,
      subtotal: partida.subtotal,
    };
  });

  return {
    id: venta.id,
    folio: venta.id,
    fecha: venta.fecha,
    items,
    subtotal: venta.subtotal,
    descuento: venta.descuento,
    iva: venta.iva,
    total: venta.total,
  };
}

export function resumenCorteAUi(resumen: ResumenCorteApi, responsable: string): CorteCaja {
  return {
    id: resumen.caja.id,
    folio: resumen.caja.id,
    fechaApertura: resumen.caja.fechaApertura,
    fechaCierre: resumen.caja.fechaCierre ?? new Date().toISOString(),
    montoInicial: resumen.caja.montoInicial,
    ventasTurno: resumen.ventasTurno,
    ingresosManual: resumen.ingresosManual,
    egresosManual: resumen.egresosManual,
    totalCierre: resumen.totalCierre,
    responsable,
  };
}

export async function listarProductosPos(): Promise<ProductoPos[]> {
  const productos = await llamarApi<Producto[]>("/productos/productos");
  return productos.map(productoApiAPos);
}

export async function listarClientesActivos(): Promise<Cliente[]> {
  const clientes = await llamarApi<Cliente[]>("/clientes");
  return clientes.filter((cliente) => cliente.activo);
}

export async function crearVenta(payload: CrearVentaPayload): Promise<VentaDetalleApi> {
  return llamarApi<VentaDetalleApi>("/ventas-caja/ventas", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function crearCompra(payload: CrearCompraPayload): Promise<unknown> {
  return llamarApi("/productos/compras", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function consultarEstadoCaja(): Promise<EstadoCajaApi> {
  return llamarApi<EstadoCajaApi>("/ventas-caja/caja/estado");
}

export async function abrirComprobanteVenta(ventaId: string): Promise<void> {
  const blob = await descargarArchivo(
    `/ventas-caja/ventas/${encodeURIComponent(ventaId)}/comprobante`,
  );
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function abrirCaja(montoInicial: number): Promise<CajaApi> {
  return llamarApi<CajaApi>("/ventas-caja/caja/abrir", {
    method: "POST",
    body: JSON.stringify({ montoInicial }),
  });
}

export async function registrarMovimientoCaja(payload: {
  tipo: "INGRESO" | "EGRESO";
  monto: number;
  motivo: string;
}): Promise<MovimientoCajaApi> {
  return llamarApi<MovimientoCajaApi>("/ventas-caja/caja/movimiento", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function cerrarCaja(): Promise<ResumenCorteApi> {
  return llamarApi<ResumenCorteApi>("/ventas-caja/caja/cerrar", {
    method: "POST",
  });
}

async function historialVentasPorCliente(clienteId: string): Promise<VentaDetalleApi[]> {
  return llamarApi<VentaDetalleApi[]>(
    `/ventas-caja/ventas/historial?clienteId=${encodeURIComponent(clienteId)}`,
  );
}

export async function cargarHistorialVentas(): Promise<VentaDetalleApi[]> {
  const clientes = await listarClientesActivos();
  if (clientes.length === 0) {
    return [];
  }

  const lotes = await Promise.all(
    clientes.map(async (cliente) => {
      try {
        return await historialVentasPorCliente(cliente.id);
      } catch {
        return [];
      }
    }),
  );

  const porId = new Map<string, VentaDetalleApi>();
  for (const venta of lotes.flat()) {
    porId.set(venta.id, venta);
  }

  return [...porId.values()].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
  );
}
