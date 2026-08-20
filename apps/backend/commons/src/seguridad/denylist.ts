import { Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

export const VERIFICADOR_DENYLIST = "VERIFICADOR_DENYLIST";

export const PREFIJO_DENYLIST = "revocado:acceso:";

export interface VerificadorDenylist {
  estaRevocado(jti: string): Promise<boolean>;
}

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
