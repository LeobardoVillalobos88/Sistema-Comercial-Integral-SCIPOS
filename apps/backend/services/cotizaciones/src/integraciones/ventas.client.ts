import { BadGatewayException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClienteHttp } from "@scipos/backend-commons";

export interface CrearVentaDesdeCotizacion {
  cotizacionId: string;
  folioCotizacion: string;
  clienteId: string;
  subtotal: number;
  iva: number;
  total: number;
  partidas: Array<{
    productoId: string;
    cantidad: number;
    precioUnitario: number;
    importe: number;
  }>;
}

interface VentaCreada {
  id: string;
}

@Injectable()
export class VentasClient {
  private readonly urlBase: string;

  constructor(
    config: ConfigService,
    private readonly http: ClienteHttp,
  ) {
    this.urlBase = config.getOrThrow<string>("VENTAS_CAJA_URL").replace(/\/$/, "");
  }

  async crearDesdeCotizacion(
    entrada: CrearVentaDesdeCotizacion,
    usuarioId: string,
  ): Promise<VentaCreada> {
    const venta = await this.http.post<VentaCreada>(
      `${this.urlBase}/ventas/convertir-cotizacion`,
      entrada,
      { usuarioId, timeoutMs: 5000 },
    );
    if (!venta?.id) {
      throw new BadGatewayException("Ventas-caja no confirmó el identificador de la venta");
    }
    return venta;
  }
}
