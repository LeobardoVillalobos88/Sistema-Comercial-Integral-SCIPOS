/**
 * Contratos del token de acceso JWT (RS256). El servicio de seguridad firma
 * con la llave privada; los demás servicios verifican con la llave pública
 * publicada en el JWKS. Así solo seguridad puede emitir tokens: el resto no
 * tiene con qué firmar (a diferencia de un secreto compartido HS256).
 */

/** Emisor esperado del token (claim `iss`). Igual en todos los servicios. */
export function emisorToken(): string {
  return process.env.JWT_ISSUER ?? "scipos-auth";
}

/** Audiencia esperada del token (claim `aud`). Igual en todos los servicios. */
export function audienciaToken(): string {
  return process.env.JWT_AUDIENCE ?? "scipos-api";
}

/** URL del JWKS del servicio de seguridad (llaves públicas de verificación). */
export function urlJwks(): string {
  return process.env.AUTH_JWKS_URL ?? "http://localhost:4001/.well-known/jwks.json";
}
