import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClienteHttp } from "@scipos/backend-commons";
import { RedisService } from "../redis/redis.service";
import {
  type ArchivoCsv,
  type TipoExportable,
  csvCortes,
  csvCotizaciones,
  csvInventario,
  csvVentas,
} from "./csv";

/** Venta tal como la entrega el servicio de ventas-caja. */
interface VentaRemota {
  id: string;
  clienteId: string;
  cotizacionId: string | null;
  subtotal: number;
  descuento: number;
  total: number;
  estado: "COMPLETA" | "CANCELADA";
  fecha: string;
  partidas: Array<{ productoId: string; cantidad: number; precioVenta: number; subtotal: number }>;
}

/** Producto tal como lo entrega el servicio de productos. */
interface ProductoRemoto {
  id: string;
  nombre: string;
  tipo: "PRODUCTO" | "SERVICIO";
  precioCompra: number;
  precioVenta: number;
  existencia: number;
  activo: boolean;
}

interface CotizacionRemota {
  id: string;
  folio: string;
  clienteNombre: string;
  estado: "BORRADOR" | "ENVIADA" | "VENDIDA";
  total: number;
  creadaEn: string;
}

interface CorteRemoto {
  id: string;
  montoInicial: number;
  montoFinal: number | null;
  fechaApertura: string;
  fechaCierre: string | null;
}

export interface RangoFechas {
  desde?: string;
  hasta?: string;
}

const TTL_CACHE_SEGUNDOS = 30;

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

function aQuery(rango: RangoFechas): string {
  const parametros = new URLSearchParams();
  if (rango.desde) {
    parametros.set("desde", rango.desde);
  }
  if (rango.hasta) {
    parametros.set("hasta", rango.hasta);
  }
  const cadena = parametros.toString();
  return cadena ? `?${cadena}` : "";
}

/**
 * Reportes comerciales (RF-30, RF-31, RF-33). El servicio no persiste nada:
 * consulta a los servicios de dominio por REST propagando la identidad del
 * solicitante y agrega los resultados, con una caché corta en Redis.
 */
@Injectable()
export class ReportesService {
  constructor(
    private readonly http: ClienteHttp,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  /** Reporte de ventas del periodo: listado y totales, separando canceladas. */
  async ventas(rango: RangoFechas, usuarioId: string) {
    const ventas = await this.obtenerVentas(rango, usuarioId);
    const completas = ventas.filter((venta) => venta.estado === "COMPLETA");
    const canceladas = ventas.filter((venta) => venta.estado === "CANCELADA");
    return {
      totalVendido: redondear(completas.reduce((suma, venta) => suma + venta.total, 0)),
      cantidadVentas: completas.length,
      cantidadCanceladas: canceladas.length,
      descuentosOtorgados: redondear(completas.reduce((suma, venta) => suma + venta.descuento, 0)),
      ventas,
    };
  }

  /** Reporte de cotizaciones del periodo: listado y conteos por estado. */
  async cotizaciones(rango: RangoFechas, usuarioId: string) {
    const base = this.url("COTIZACIONES_URL", "http://localhost:4004");
    const [lista, resumen] = await Promise.all([
      this.http.get<CotizacionRemota[]>(`${base}/cotizaciones${aQuery(rango)}`, { usuarioId }),
      this.http.get<Record<string, number>>(`${base}/cotizaciones/resumen${aQuery(rango)}`, {
        usuarioId,
      }),
    ]);
    return { ...resumen, cotizaciones: lista };
  }

  /** Reporte de inventario: catálogo valuado a precio de compra y de venta. */
  async productos(usuarioId: string) {
    const base = this.url("PRODUCTOS_URL", "http://localhost:4002");
    const productos = await this.http.get<ProductoRemoto[]>(`${base}/productos`, { usuarioId });
    const fisicos = productos.filter((producto) => producto.tipo === "PRODUCTO");
    return {
      totalProductos: productos.length,
      activos: productos.filter((producto) => producto.activo).length,
      stockBajo: fisicos.filter((producto) => producto.activo && producto.existencia <= 10).length,
      valorInventarioCompra: redondear(
        fisicos.reduce((suma, p) => suma + p.precioCompra * p.existencia, 0),
      ),
      valorInventarioVenta: redondear(
        fisicos.reduce((suma, p) => suma + p.precioVenta * p.existencia, 0),
      ),
      productos,
    };
  }

  /** Reporte de cortes de caja realizados. */
  async cortes(usuarioId: string) {
    const base = this.url("VENTAS_CAJA_URL", "http://localhost:4005");
    const cortes = await this.http.get<CorteRemoto[]>(`${base}/caja/cortes`, { usuarioId });
    return { cantidadCortes: cortes.length, cortes };
  }

  /**
   * Utilidad del periodo (RF-33): por cada partida vendida se resta el costo
   * actual del producto (precioCompra) al precio al que se vendió, y al total
   * se le descuentan los descuentos otorgados.
   */
  async utilidad(rango: RangoFechas, usuarioId: string) {
    const claveCache = `reportes:utilidad:${rango.desde ?? ""}:${rango.hasta ?? ""}`;
    const cacheado = await this.redis.get<object>(claveCache);
    if (cacheado) {
      return cacheado;
    }

    const [ventas, productos] = await Promise.all([
      this.obtenerVentas(rango, usuarioId),
      this.http.get<ProductoRemoto[]>(
        `${this.url("PRODUCTOS_URL", "http://localhost:4002")}/productos`,
        {
          usuarioId,
        },
      ),
    ]);
    const costoPorProducto = new Map(productos.map((p) => [p.id, p.precioCompra]));

    let ingresos = 0;
    let costo = 0;
    let descuentos = 0;
    for (const venta of ventas) {
      if (venta.estado !== "COMPLETA") {
        continue;
      }
      descuentos += venta.descuento;
      for (const partida of venta.partidas) {
        ingresos += partida.subtotal;
        costo += (costoPorProducto.get(partida.productoId) ?? 0) * partida.cantidad;
      }
    }

    const resultado = {
      ingresos: redondear(ingresos),
      costoDeVentas: redondear(costo),
      descuentosOtorgados: redondear(descuentos),
      utilidadBruta: redondear(ingresos - costo - descuentos),
      margenPorcentaje:
        ingresos > 0 ? redondear(((ingresos - costo - descuentos) / ingresos) * 100) : 0,
      ventasConsideradas: ventas.filter((venta) => venta.estado === "COMPLETA").length,
    };
    await this.redis.set(claveCache, resultado, TTL_CACHE_SEGUNDOS);
    return resultado;
  }

  /**
   * Arma el archivo CSV de un reporte (RF-30: exportación de información).
   *
   * Se resuelve en el servidor y no en el navegador para que la descarga pase
   * por el guard de `reportes:exportar`. Armado desde los datos que la pantalla
   * ya tiene, el privilegio no se podría aplicar.
   */
  async exportar(tipo: TipoExportable, rango: RangoFechas, usuarioId: string): Promise<ArchivoCsv> {
    if (tipo === "ventas") {
      const reporte = await this.ventas(rango, usuarioId);
      return csvVentas(reporte.ventas);
    }
    if (tipo === "cotizaciones") {
      const reporte = await this.cotizaciones(rango, usuarioId);
      return csvCotizaciones(reporte.cotizaciones);
    }
    if (tipo === "inventario") {
      const reporte = await this.productos(usuarioId);
      return csvInventario(reporte.productos);
    }
    const reporte = await this.cortes(usuarioId);
    return csvCortes(reporte.cortes);
  }

  private obtenerVentas(rango: RangoFechas, usuarioId: string): Promise<VentaRemota[]> {
    const base = this.url("VENTAS_CAJA_URL", "http://localhost:4005");
    return this.http.get<VentaRemota[]>(`${base}/ventas${aQuery(rango)}`, { usuarioId });
  }

  private url(variable: string, porDefecto: string): string {
    return this.config.get<string>(variable) ?? porDefecto;
  }
}
