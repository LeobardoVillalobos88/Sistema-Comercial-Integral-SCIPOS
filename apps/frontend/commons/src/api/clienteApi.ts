/**
 * Cliente HTTP del frontend. Todas las llamadas van al API Gateway y llevan
 * el token JWT de la sesión activa (`Authorization: Bearer <token>`), que es
 * como el backend identifica al usuario y valida sus privilegios.
 */

/** URL base del gateway (configurable con NEXT_PUBLIC_API_URL). */
export const URL_API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

let tokenSesion: string | null = null;

/** Define el token JWT con el que el cliente firmará las peticiones. */
export function establecerToken(token: string | null): void {
  tokenSesion = token;
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
 * ejemplo `llamarApi("/seguridad/auth/perfil")`.
 */
export async function llamarApi<T>(ruta: string, init?: RequestInit): Promise<T> {
  const encabezados = new Headers(init?.headers);
  encabezados.set("Content-Type", "application/json");
  if (tokenSesion) {
    encabezados.set("Authorization", `Bearer ${tokenSesion}`);
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

/**
 * Descarga un recurso binario (por ejemplo un PDF) con la sesión activa y
 * devuelve el blob listo para abrirse o guardarse.
 */
export async function descargarArchivo(ruta: string): Promise<Blob> {
  const encabezados = new Headers();
  if (tokenSesion) {
    encabezados.set("Authorization", `Bearer ${tokenSesion}`);
  }
  const respuesta = await fetch(`${URL_API}${ruta}`, { headers: encabezados });
  if (!respuesta.ok) {
    throw new ErrorApi(respuesta.status, `No se pudo descargar el archivo (${respuesta.status}).`);
  }
  return respuesta.blob();
}
