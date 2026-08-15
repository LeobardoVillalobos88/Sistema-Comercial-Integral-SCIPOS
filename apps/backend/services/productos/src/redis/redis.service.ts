import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";

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

  async set(clave: string, valor: unknown, ttlSegundos = 60): Promise<void> {
    try {
      await this.client.set(clave, JSON.stringify(valor), "EX", ttlSegundos);
    } catch {}
  }

  async del(...claves: string[]): Promise<void> {
    if (claves.length === 0) {
      return;
    }
    try {
      await this.client.del(...claves);
    } catch {}
  }
}
