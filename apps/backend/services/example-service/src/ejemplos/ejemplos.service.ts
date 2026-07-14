import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import type { ActualizarEjemploDto } from "./dto/actualizar-ejemplo.dto";
import type { CrearEjemploDto } from "./dto/crear-ejemplo.dto";

const CLAVE_CACHE_LISTA = "ejemplos:lista";

@Injectable()
export class EjemplosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async crear(dto: CrearEjemploDto) {
    const ejemplo = await this.prisma.ejemplo.create({ data: dto });
    await this.redis.del(CLAVE_CACHE_LISTA);
    return ejemplo;
  }

  async listar() {
    const cacheado = await this.redis.get<unknown[]>(CLAVE_CACHE_LISTA);
    if (cacheado) {
      return cacheado;
    }
    const ejemplos = await this.prisma.ejemplo.findMany({ orderBy: { createdAt: "desc" } });
    await this.redis.set(CLAVE_CACHE_LISTA, ejemplos, 30);
    return ejemplos;
  }

  async obtener(id: string) {
    const ejemplo = await this.prisma.ejemplo.findUnique({ where: { id } });
    if (!ejemplo) {
      throw new NotFoundException(`El ejemplo "${id}" no existe.`);
    }
    return ejemplo;
  }

  async actualizar(id: string, dto: ActualizarEjemploDto) {
    await this.obtener(id);
    const ejemplo = await this.prisma.ejemplo.update({ where: { id }, data: dto });
    await this.redis.del(CLAVE_CACHE_LISTA);
    return ejemplo;
  }

  async eliminar(id: string) {
    await this.obtener(id);
    await this.prisma.ejemplo.delete({ where: { id } });
    await this.redis.del(CLAVE_CACHE_LISTA);
    return { eliminado: true };
  }
}
