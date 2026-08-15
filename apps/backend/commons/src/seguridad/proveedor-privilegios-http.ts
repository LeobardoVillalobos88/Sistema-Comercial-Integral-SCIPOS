import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import type { ProveedorPrivilegios, ResultadoVerificacion } from "../contratos/privilegios";

@Injectable()
export class ProveedorPrivilegiosHttp implements ProveedorPrivilegios {
  private get urlBase(): string {
    return process.env.SEGURIDAD_URL ?? "http://localhost:4001";
  }

  async verificar(usuarioId: string, privilegio: string): Promise<ResultadoVerificacion> {
    const url = new URL(`${this.urlBase}/privilegios/verificar`);
    url.searchParams.set("usuarioId", usuarioId);
    url.searchParams.set("privilegio", privilegio);

    let respuesta: Response;
    try {
      respuesta = await fetch(url, { signal: AbortSignal.timeout(5000) });
    } catch {
      throw new ServiceUnavailableException(
        "No fue posible verificar privilegios: el servicio de seguridad no responde.",
      );
    }
    if (!respuesta.ok) {
      throw new ServiceUnavailableException(
        `No fue posible verificar privilegios (respuesta ${respuesta.status} de seguridad).`,
      );
    }
    return (await respuesta.json()) as ResultadoVerificacion;
  }
}
