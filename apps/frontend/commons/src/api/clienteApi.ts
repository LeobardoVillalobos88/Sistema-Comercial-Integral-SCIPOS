/**
 * Cliente HTTP del frontend. Todas las llamadas van al API Gateway y llevan el
 * access token JWT de la sesión activa (`Authorization: Bearer`). Cuando el
 * access expira (401), el cliente lo renueva solo con el refresh token y
 * reintenta la petición una vez, de forma transparente para las pantallas.
 */

/** URL base del gateway (configurable con NEXT_PUBLIC_API_URL). */
export const URL_API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

let tokenSesion: string | null = null;
let refreshTokenSesion: string | null = null;
/** Notifica a la sesión (PermisosProvider) los tokens renovados para persistirlos. */
let alRenovarTokens: ((tokens: { token: string; refreshToken: string }) => void) | null = null;
/** Promesa de refresh en curso, para no lanzar varias renovaciones a la vez. */
let refrescoEnCurso: Promise<boolean> | null = null;

/** Define el access token con el que el cliente firma las peticiones. */
export function establecerToken(token: string | null): void {
  tokenSesion = token;
}

/** Define el refresh token con el que se renueva la sesión al expirar el access. */
export function establecerRefreshToken(refreshToken: string | null): void {
  refreshTokenSesion = refreshToken;
}

/** Registra el callback que persiste los tokens cuando el cliente los renueva. */
export function registrarRenovacionTokens(
  callback: ((tokens: { token: string; refreshToken: string }) => void) | null,
): void {
  alRenovarTokens = callback;
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

/** Intenta renovar el access token con el refresh; true si lo consiguió. */
async function refrescarSesion(): Promise<boolean> {
  if (!refreshTokenSesion) {
    return false;
  }
  if (!refrescoEnCurso) {
    refrescoEnCurso = (async () => {
      try {
        const respuesta = await fetch(`${URL_API}/seguridad/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: refreshTokenSesion }),
        });
        if (!respuesta.ok) {
          return false;
        }
        const datos = (await respuesta.json()) as { token: string; refreshToken: string };
        tokenSesion = datos.token;
        refreshTokenSesion = datos.refreshToken;
        alRenovarTokens?.({ token: datos.token, refreshToken: datos.refreshToken });
        return true;
      } catch {
        return false;
      } finally {
        refrescoEnCurso = null;
      }
    })();
  }
  return refrescoEnCurso;
}

async function ejecutar(ruta: string, init: RequestInit): Promise<Response> {
  const encabezados = new Headers(init.headers);
  if (tokenSesion) {
    encabezados.set("Authorization", `Bearer ${tokenSesion}`);
  }
  return fetch(`${URL_API}${ruta}`, { ...init, headers: encabezados });
}

/**
 * Llama a la API a través del gateway. `ruta` es relativa a la base, por
 * ejemplo `llamarApi("/seguridad/auth/perfil")`.
 */
export async function llamarApi<T>(ruta: string, init?: RequestInit): Promise<T> {
  const encabezados = new Headers(init?.headers);
  encabezados.set("Content-Type", "application/json");
  const opciones: RequestInit = { ...init, headers: encabezados };

  let respuesta = await ejecutar(ruta, opciones);
  // Access expirado: renueva con el refresh y reintenta una sola vez.
  const esRutaAuth = ruta.startsWith("/seguridad/auth/");
  if (respuesta.status === 401 && !esRutaAuth && (await refrescarSesion())) {
    respuesta = await ejecutar(ruta, opciones);
  }

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
  let respuesta = await ejecutar(ruta, { method: "GET" });
  if (respuesta.status === 401 && (await refrescarSesion())) {
    respuesta = await ejecutar(ruta, { method: "GET" });
  }
  if (!respuesta.ok) {
    throw new ErrorApi(respuesta.status, `No se pudo descargar el archivo (${respuesta.status}).`);
  }
  return respuesta.blob();
}
