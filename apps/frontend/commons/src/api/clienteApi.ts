/**
 * Cliente HTTP del frontend. Todas las llamadas van al API Gateway y llevan
 * el header `x-usuario-id` con el usuario activo, que es como el backend
 * identifica y valida los privilegios de cada petición.
 */

/** URL base del gateway (configurable con NEXT_PUBLIC_API_URL). */
export const URL_API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const HEADER_USUARIO_ID = "x-usuario-id";

let usuarioActivoId: string | null = null;

/** Define el usuario activo cuyas peticiones firmará el cliente. */
export function establecerUsuarioActivoId(id: string | null): void {
  usuarioActivoId = id;
}

/** Id del usuario activo (null si aún no se resuelve contra la API). */
export function obtenerUsuarioActivoId(): string | null {
  return usuarioActivoId;
}

/** Error de la API con el estatus HTTP y el mensaje del backend. */
export class ErrorApi extends Error {
  readonly estatus: number;

  constructor(estatus: number, mensaje: string) {
    super(mensaje);
    this.name = "ErrorApi";
    this.estatus = estatus;
  }
}

interface CuerpoErrorBackend {
  mensaje?: string | string[];
  message?: string | string[];
}

/**
 * Llama a la API a través del gateway. `ruta` es relativa a la base, por
 * ejemplo `llamarApi("/seguridad/usuarios")`.
 */
export async function llamarApi<T>(ruta: string, init?: RequestInit): Promise<T> {
  const encabezados = new Headers(init?.headers);
  encabezados.set("Content-Type", "application/json");
  if (usuarioActivoId) {
    encabezados.set(HEADER_USUARIO_ID, usuarioActivoId);
  }

  const respuesta = await fetch(`${URL_API}${ruta}`, { ...init, headers: encabezados });
  const texto = await respuesta.text();
  const datos = texto ? (JSON.parse(texto) as unknown) : null;

  if (!respuesta.ok) {
    const cuerpo = (datos ?? {}) as CuerpoErrorBackend;
    const crudo = cuerpo.mensaje ?? cuerpo.message ?? `Error ${respuesta.status} de la API.`;
    const mensaje = Array.isArray(crudo) ? crudo.join(" ") : crudo;
    throw new ErrorApi(respuesta.status, mensaje);
  }
  return datos as T;
}
