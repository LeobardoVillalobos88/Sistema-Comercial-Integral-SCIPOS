import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";

/**
 * Caché con Redis. Si Redis no está disponible, el servicio sigue
 * funcionando: solo pierde la caché y consulta directo a la base de datos.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;

  onModuleInit() {
    this.client = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    this.client.on("error", (err) => this.logger.warn(`Redis no disponible: ${err.message}`));
  }

  onModuleDestroy() {
    this.client?.quit().catch(() => undefined);
  }

  async get<T>(clave: string): Promise<T | null> {
    try {
      const crudo = await this.client.get(clave);
      return crudo ? (JSON.parse(crudo) as T) : null;
    } catch {
      return null;
    }
  }

  /** Guarda con TTL (segundos) para que la caché se auto-expire. */
  async set(clave: string, valor: unknown, ttlSegundos = 60): Promise<void> {
    try {
      await this.client.set(clave, JSON.stringify(valor), "EX", ttlSegundos);
    } catch {
      // Sin caché disponible; la siguiente lectura irá a la base de datos.
    }
  }

  async del(...claves: string[]): Promise<void> {
    if (claves.length === 0) {
      return;
    }
    try {
      await this.client.del(...claves);
    } catch {
      // Sin caché disponible; no hay nada que invalidar.
    }
  }

  /**
   * Marca una clave con el valor crudo "1" y un TTL (segundos), sin serializar.
   * Lo usa la denylist de tokens: el verificador de commons compara contra "1".
   */
  async marcar(clave: string, ttlSegundos: number): Promise<void> {
    try {
      if (ttlSegundos > 0) {
        await this.client.set(clave, "1", "EX", ttlSegundos);
      }
    } catch {
      // Sin Redis no se puede revocar al instante; el token expirará por sí solo.
    }
  }
}
