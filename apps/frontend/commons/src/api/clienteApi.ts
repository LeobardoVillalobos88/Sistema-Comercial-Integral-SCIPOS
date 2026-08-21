export const URL_API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

let tokenSesion: string | null = null;
let refreshTokenSesion: string | null = null;
let alRenovarTokens: ((tokens: { token: string; refreshToken: string }) => void) | null = null;
let refrescoEnCurso: Promise<boolean> | null = null;

export function establecerToken(token: string | null): void {
  tokenSesion = token;
}

export function establecerRefreshToken(refreshToken: string | null): void {
  refreshTokenSesion = refreshToken;
}

export function registrarRenovacionTokens(
  callback: ((tokens: { token: string; refreshToken: string }) => void) | null,
): void {
  alRenovarTokens = callback;
}

const ESTATUS_SIN_SERVICIO = new Set([502, 503, 504]);
const MENSAJE_SIN_CONEXION = "No se pudo contactar al servidor.";

export class ErrorApi extends Error {
  readonly estatus: number;
  readonly esDeConectividad: boolean;

  constructor(estatus: number, mensaje: string, esDeConectividad = false) {
    super(mensaje);
    this.name = "ErrorApi";
    this.estatus = estatus;
    this.esDeConectividad = esDeConectividad;
  }
}

let alExpirarSesion: (() => void) | null = null;

export function registrarSesionExpirada(callback: (() => void) | null): void {
  alExpirarSesion = callback;
}

interface CuerpoErrorBackend {
  mensaje?: string | string[];
  message?: string | string[];
}

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
    throw new ErrorApi(503, MENSAJE_SIN_CONEXION, true);
  }
}

export async function llamarApi<T>(ruta: string, init?: RequestInit): Promise<T> {
  const encabezados = new Headers(init?.headers);
  encabezados.set("Content-Type", "application/json");
  const opciones: RequestInit = { ...init, headers: encabezados };

  let respuesta = await ejecutar(ruta, opciones);
  const esRutaAuth = ruta.startsWith("/seguridad/auth/");
  if (respuesta.status === 401 && !esRutaAuth) {
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

async function mensajeDeErrorDescarga(respuesta: Response): Promise<string> {
  try {
    const cuerpo = (await respuesta.json()) as CuerpoErrorBackend;
    const crudo = cuerpo.mensaje ?? cuerpo.message;
    if (crudo) {
      return Array.isArray(crudo) ? crudo.join(" ") : crudo;
    }
  } catch {}
  return `No se pudo descargar el archivo (${respuesta.status}).`;
}

export async function guardarArchivo(ruta: string, nombreSugerido: string): Promise<void> {
  const blob = await descargarArchivo(ruta);
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreSugerido;
  enlace.click();
  URL.revokeObjectURL(url);
}
