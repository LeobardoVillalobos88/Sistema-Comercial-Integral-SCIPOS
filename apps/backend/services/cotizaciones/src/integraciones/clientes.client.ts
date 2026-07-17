import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClienteHttp } from "@scipos/backend-commons";

export interface ClienteRemoto {
  id: string;
  nombre: string;
  activo: boolean;
}

@Injectable()
export class ClientesClient {
  private readonly urlBase: string;

  constructor(
    config: ConfigService,
    private readonly http: ClienteHttp,
  ) {
    this.urlBase = config.getOrThrow<string>("CLIENTES_URL").replace(/\/$/, "");
  }

  async obtenerActivo(clienteId: string, usuarioId: string): Promise<ClienteRemoto> {
    const cliente = await this.http.get<ClienteRemoto>(
      `${this.urlBase}/${encodeURIComponent(clienteId)}`,
      { usuarioId, timeoutMs: 3000 },
    );
    if (!cliente.activo) {
      throw new UnprocessableEntityException(`El cliente ${clienteId} está inactivo`);
    }
    return cliente;
  }
}
