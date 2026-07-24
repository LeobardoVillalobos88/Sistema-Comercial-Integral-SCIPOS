/**
 * Verificación JWT en el borde del gateway: rechaza tokens inválidos o
 * revocados antes de proxyear al servicio (política uniforme y ahorro de red).
 * Los servicios re-validan igual (defensa en profundidad): si alguien alcanza
 * un servicio sin pasar por el gateway, no confía ciegamente.
 */
import { PREFIJO_DENYLIST, audienciaToken, emisorToken, urlJwks } from "@scipos/backend-commons";
import type { NextFunction, Request, Response } from "express";
import Redis from "ioredis";
import { createRemoteJWKSet, jwtVerify } from "jose";

/** Rutas que no exigen token (login, refresh, logout, JWKS, health y docs). */
function esPublica(ruta: string, metodo: string): boolean {
  if (metodo === "OPTIONS") {
    return true;
  }
  const publicasExactas = [
    "/api/seguridad/auth/login",
    "/api/seguridad/auth/refresh",
    "/api/seguridad/auth/logout",
    "/api/seguridad/.well-known/jwks.json",
    "/health",
    "/favicon.ico",
  ];
  if (publicasExactas.includes(ruta)) {
    return true;
  }
  // Health y documentación Scalar de cada servicio.
  return ruta.endsWith("/health") || ruta.includes("/docs") || ruta.endsWith("/api-json");
}

function responder401(res: Response, mensaje: string) {
  res.status(401).json({ estatus: 401, mensaje, error: "No autorizado" });
}

/** Crea el middleware de verificación en el edge. */
export function crearMiddlewareJwt() {
  const jwks = createRemoteJWKSet(new URL(urlJwks()));
  const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: true,
  });
  redis.on("error", () => undefined);
  redis.connect().catch(() => undefined);

  async function estaRevocado(jti: string): Promise<boolean> {
    try {
      return (await redis.get(`${PREFIJO_DENYLIST}${jti}`)) === "1";
    } catch {
      // Redis caído: se degrada a solo-firma (los servicios conservan su propia
      // verificación). Mismo criterio fail-open que la caché de privilegios.
      return false;
    }
  }

  return async (req: Request, res: Response, next: NextFunction) => {
    const ruta = (req.originalUrl || req.url || "").split("?")[0];
    if (esPublica(ruta, req.method)) {
      return next();
    }

    const autorizacion = req.headers.authorization;
    if (!autorizacion?.startsWith("Bearer ")) {
      return responder401(res, "Se requiere un token Bearer.");
    }

    try {
      const { payload } = await jwtVerify(autorizacion.slice("Bearer ".length), jwks, {
        algorithms: ["RS256"],
        issuer: emisorToken(),
        audience: audienciaToken(),
      });
      if (!payload.jti) {
        return responder401(res, "El token no es revocable (falta jti).");
      }
      if (await estaRevocado(payload.jti)) {
        return responder401(res, "La sesión fue cerrada (token revocado).");
      }
      return next();
    } catch {
      return responder401(res, "El token es inválido o ya expiró.");
    }
  };
}
