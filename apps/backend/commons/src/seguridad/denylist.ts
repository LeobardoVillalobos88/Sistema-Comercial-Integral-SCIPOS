import { Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

/** Token de inyección del verificador de denylist. */
export const VERIFICADOR_DENYLIST = "VERIFICADOR_DENYLIST";

/** Prefijo de la clave en Redis donde se marca un token revocado por su jti. */
export const PREFIJO_DENYLIST = "revocado:acceso:";

/**
 * Consulta si un token de acceso fue revocado (logout). La firma de un token
 * deslogueado sigue siendo válida hasta que expira, así que la única forma de
 * cortarlo al instante es consultar esta lista compartida.
 */
export interface VerificadorDenylist {
  estaRevocado(jti: string): Promise<boolean>;
}

/**
 * Implementación con Redis. Si Redis está caído degrada a "no revocado"
 * (fail-open, igual criterio que la caché de privilegios): el sistema sigue
 * operando aunque pierda la capacidad de cortar sesiones al instante.
 */
@Injectable()
export class DenylistRedis implements VerificadorDenylist, OnModuleDestroy {
  private readonly logger = new Logger(DenylistRedis.name);
  private readonly client = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: true,
  });

  constructor() {
    this.client.on("error", (err) => this.logger.warn(`Redis no disponible: ${err.message}`));
    this.client.connect().catch(() => undefined);
  }

  onModuleDestroy() {
    this.client.quit().catch(() => undefined);
  }

  async estaRevocado(jti: string): Promise<boolean> {
    try {
      return (await this.client.get(`${PREFIJO_DENYLIST}${jti}`)) === "1";
    } catch {
      return false;
    }
  }
}
