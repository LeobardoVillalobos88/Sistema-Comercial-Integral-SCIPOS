import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClienteHttp } from "@scipos/backend-commons";

export interface ProductoRemoto {
  id: string;
  nombre: string;
  precioVenta: number | string;
  activo: boolean;
}

@Injectable()
export class ProductosClient {
  private readonly urlBase: string;

  constructor(
    config: ConfigService,
    private readonly http: ClienteHttp,
  ) {
    this.urlBase = config.getOrThrow<string>("PRODUCTOS_URL").replace(/\/$/, "");
  }

  async obtenerActivo(productoId: string, usuarioId: string): Promise<ProductoRemoto> {
    const producto = await this.http.get<ProductoRemoto>(
      `${this.urlBase}/productos/${encodeURIComponent(productoId)}`,
      { usuarioId, timeoutMs: 3000 },
    );
    if (!producto.activo) {
      throw new UnprocessableEntityException(`El producto ${productoId} está inactivo`);
    }
    return producto;
  }
}
