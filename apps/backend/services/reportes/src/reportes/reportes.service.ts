import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClienteHttp } from "@scipos/backend-commons";
import { RedisService } from "../redis/redis.service";

interface VentaRemota {
  id: string;
  clienteId: string;
  cotizacionId: string | null;
  subtotal: number;
  descuento: number;
  iva: number;
  total: number;
  estado: "COMPLETA" | "CANCELADA";
  fecha: string;
  partidas: Array<{ productoId: string; cantidad: number; precioVenta: number; subtotal: number }>;
}

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

@Injectable()
export class ReportesService {
  constructor(
    private readonly http: ClienteHttp,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

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

  async cortes(usuarioId: string) {
    const base = this.url("VENTAS_CAJA_URL", "http://localhost:4005");
    const cortes = await this.http.get<CorteRemoto[]>(`${base}/caja/cortes`, { usuarioId });
    return { cantidadCortes: cortes.length, cortes };
  }

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

  private obtenerVentas(rango: RangoFechas, usuarioId: string): Promise<VentaRemota[]> {
    const base = this.url("VENTAS_CAJA_URL", "http://localhost:4005");
    return this.http.get<VentaRemota[]>(`${base}/ventas${aQuery(rango)}`, { usuarioId });
  }

  private url(variable: string, porDefecto: string): string {
    return this.config.get<string>(variable) ?? porDefecto;
  }
}
