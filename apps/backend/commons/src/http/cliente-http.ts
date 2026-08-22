import { HttpException, Injectable } from "@nestjs/common";
import { HEADER_USUARIO_ID } from "../contratos/identidad";

export interface OpcionesSolicitud {
  /** Identidad a propagar al otro servicio (header x-usuario-id). */
  usuarioId?: string;
  /** Tiempo máximo de espera en milisegundos. */
  timeoutMs?: number;
}

/**
 * Cliente HTTP para comunicación entre servicios (REST). Aplica timeout,
 * propaga la identidad del usuario y traduce las respuestas de error a
 * excepciones de Nest conservando el estatus original.
 *
 * Registrarlo como provider del módulo que lo necesite:
 *   providers: [ClienteHttp]
 */
@Injectable()
export class ClienteHttp {
  get<T>(url: string, opciones?: OpcionesSolicitud): Promise<T> {
    return this.solicitar<T>("GET", url, undefined, opciones);
  }

  post<T>(url: string, cuerpo?: unknown, opciones?: OpcionesSolicitud): Promise<T> {
    return this.solicitar<T>("POST", url, cuerpo, opciones);
  }

  patch<T>(url: string, cuerpo?: unknown, opciones?: OpcionesSolicitud): Promise<T> {
    return this.solicitar<T>("PATCH", url, cuerpo, opciones);
  }

  delete<T>(url: string, opciones?: OpcionesSolicitud): Promise<T> {
    return this.solicitar<T>("DELETE", url, undefined, opciones);
  }

  private async solicitar<T>(
    metodo: string,
    url: string,
    cuerpo?: unknown,
    opciones?: OpcionesSolicitud,
  ): Promise<T> {
    const encabezados: Record<string, string> = { "Content-Type": "application/json" };
    if (opciones?.usuarioId) {
      encabezados[HEADER_USUARIO_ID] = opciones.usuarioId;
    }

    let respuesta: Response;
    try {
      respuesta = await fetch(url, {
        method: metodo,
        headers: encabezados,
        body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
        signal: AbortSignal.timeout(opciones?.timeoutMs ?? 5000),
      });
    } catch {
      throw new HttpException(`El servicio remoto no responde (${metodo} ${url}).`, 503);
    }

    const texto = await respuesta.text();
    const datos = texto ? (JSON.parse(texto) as Record<string, unknown>) : null;

    if (!respuesta.ok) {
      const mensaje =
        (datos?.mensaje as string) ??
        (datos?.message as string) ??
        `Error ${respuesta.status} del servicio remoto.`;
      throw new HttpException(mensaje, respuesta.status);
    }
    return datos as T;
  }
}
