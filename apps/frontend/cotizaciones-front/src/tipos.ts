import type { EstadoCotizacion } from "@scipos/frontend-commons";

/** Partida tal como la devuelve el servicio de cotizaciones. */
export interface PartidaCotizacionApi {
  id: string;
  productoId: string;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  importe: number;
}

/** Cotización con snapshots, importes y fechas calculados por el backend. */
export interface CotizacionApi {
  id: string;
  folio: string;
  clienteId: string;
  clienteNombre: string;
  estado: EstadoCotizacion;
  subtotal: number;
  iva: number;
  total: number;
  ventaId: string | null;
  creadaEn: string;
  actualizadaEn: string;
  partidas: PartidaCotizacionApi[];
}

export interface CrearCotizacionApi {
  clienteId: string;
  partidas: Array<{
    productoId: string;
    cantidad: number;
  }>;
}
