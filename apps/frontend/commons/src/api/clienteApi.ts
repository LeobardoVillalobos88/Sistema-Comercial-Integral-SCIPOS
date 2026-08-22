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

/** Estatus con los que el gateway avisa que un servicio no está respondiendo. */
const ESTATUS_SIN_SERVICIO = new Set([502, 503, 504]);
const MENSAJE_SIN_CONEXION = "No se pudo contactar al servidor.";

/** Error de la API con el estatus HTTP y el mensaje del backend. */
export class ErrorApi extends Error {
  readonly estatus: number;
  /**
   * Cierto cuando no se pudo hablar con el servidor (red caída, gateway abajo,
   * servicio sin responder). Distinto de un backend que sí contestó, pero con
   * un error: eso se le explica al usuario de otra manera.
   */
  readonly esDeConectividad: boolean;

  constructor(estatus: number, mensaje: string, esDeConectividad = false) {
    super(mensaje);
    this.name = "ErrorApi";
    this.estatus = estatus;
    this.esDeConectividad = esDeConectividad;
  }
}

/** Aviso a la sesión de que el token venció y no se pudo renovar. */
let alExpirarSesion: (() => void) | null = null;

/**
 * Registra a quién avisar cuando la sesión muere a media faena: el access
 * expiró y el refresh ya no sirve. Lo usa el proveedor de permisos para
 * mandar al usuario a la pantalla de sesión terminada.
 */
export function registrarSesionExpirada(callback: (() => void) | null): void {
  alExpirarSesion = callback;
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
  try {
    return await fetch(`${URL_API}${ruta}`, { ...init, headers: encabezados });
  } catch {
    // fetch solo rechaza cuando la petición no llegó a ningún lado.
    throw new ErrorApi(503, MENSAJE_SIN_CONEXION, true);
  }
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
  if (respuesta.status === 401 && !esRutaAuth) {
    // Solo cuenta como sesión caída si de verdad había una; un 401 sin tokens
    // es alguien que todavía no entra, y a ese lo espera el login.
    const habiaSesion = Boolean(tokenSesion || refreshTokenSesion);
    if (await refrescarSesion()) {
      respuesta = await ejecutar(ruta, opciones);
    } else if (habiaSesion) {
      alExpirarSesion?.();
    }
  }

  const texto = await respuesta.text();
  const datos = texto ? (JSON.parse(texto) as unknown) : null;

  if (!respuesta.ok) {
    const cuerpo = (datos ?? {}) as CuerpoErrorBackend;
    const crudo = cuerpo.mensaje ?? cuerpo.message ?? `Error ${respuesta.status} de la API.`;
    const mensaje = Array.isArray(crudo) ? crudo.join(" ") : crudo;
    throw new ErrorApi(respuesta.status, mensaje, ESTATUS_SIN_SERVICIO.has(respuesta.status));
  }
  return datos as T;
}

/**
 * Descarga un recurso binario (por ejemplo un PDF o un CSV) con la sesión
 * activa y devuelve el blob listo para abrirse o guardarse.
 *
 * Al fallar lee el mensaje del cuerpo: un error del backend sigue siendo JSON
 * aunque la petición pidiera un archivo, y así el usuario ve qué privilegio le
 * falta en vez de solo el número del estatus.
 */
export async function descargarArchivo(ruta: string): Promise<Blob> {
  let respuesta = await ejecutar(ruta, { method: "GET" });
  if (respuesta.status === 401 && (await refrescarSesion())) {
    respuesta = await ejecutar(ruta, { method: "GET" });
  }
  if (!respuesta.ok) {
    throw new ErrorApi(
      respuesta.status,
      await mensajeDeErrorDescarga(respuesta),
      ESTATUS_SIN_SERVICIO.has(respuesta.status),
    );
  }
  return respuesta.blob();
}

/** Saca el mensaje del backend de una descarga fallida; si no lo hay, describe el estatus. */
async function mensajeDeErrorDescarga(respuesta: Response): Promise<string> {
  try {
    const cuerpo = (await respuesta.json()) as CuerpoErrorBackend;
    const crudo = cuerpo.mensaje ?? cuerpo.message;
    if (crudo) {
      return Array.isArray(crudo) ? crudo.join(" ") : crudo;
    }
  } catch {
    // El error vino sin cuerpo o sin JSON; queda el mensaje genérico.
  }
  return `No se pudo descargar el archivo (${respuesta.status}).`;
}

/**
 * Descarga un archivo del backend y se lo entrega al navegador para guardarlo.
 * El objeto URL se libera enseguida: cada uno retiene el blob en memoria hasta
 * que se suelta, y exportar varias veces seguidas los iría acumulando.
 */
export async function guardarArchivo(ruta: string, nombreSugerido: string): Promise<void> {
  const blob = await descargarArchivo(ruta);
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreSugerido;
  enlace.click();
  URL.revokeObjectURL(url);
}
