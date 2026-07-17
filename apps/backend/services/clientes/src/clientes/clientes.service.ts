import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClienteHttp } from "@scipos/backend-commons";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import type { ActualizarClienteDto } from "./dto/actualizar-cliente.dto";
import type { ActualizarEstadoDto } from "./dto/actualizar-estado.dto";
import type { CrearClienteDto } from "./dto/crear-cliente.dto";

const CLAVE_CACHE_LISTA = "clientes:lista";

@Injectable()
export class ClientesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly http: ClienteHttp,
    private readonly config: ConfigService,
  ) {}

  async crear(dto: CrearClienteDto) {
    const cliente = await this.prisma.cliente.create({ data: dto });
    await this.redis.del(CLAVE_CACHE_LISTA);
    return cliente;
  }

  async listar(busqueda?: string) {
    // Si hay búsqueda, consultamos directo a la base de datos sin cachear.
    if (busqueda) {
      const termino = busqueda.trim();
      return this.prisma.cliente.findMany({
        where: {
          OR: [
            { nombre: { contains: termino, mode: "insensitive" } },
            { rfc: { contains: termino, mode: "insensitive" } },
            { correo: { contains: termino, mode: "insensitive" } },
            { telefono: { contains: termino, mode: "insensitive" } },
          ],
        },
        orderBy: { nombre: "asc" },
      });
    }

    // Si no hay búsqueda, usamos caché Redis.
    const cacheado = await this.redis.get<unknown[]>(CLAVE_CACHE_LISTA);
    if (cacheado) {
      return cacheado;
    }

    const clientes = await this.prisma.cliente.findMany({ orderBy: { nombre: "asc" } });
    await this.redis.set(CLAVE_CACHE_LISTA, clientes, 60); // Guardar en caché por 60 segundos
    return clientes;
  }

  async obtener(id: string) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id } });
    if (!cliente) {
      throw new NotFoundException(`El cliente con ID "${id}" no existe.`);
    }
    return cliente;
  }

  async actualizar(id: string, dto: ActualizarClienteDto) {
    await this.obtener(id);
    const cliente = await this.prisma.cliente.update({
      where: { id },
      data: dto,
    });
    await this.redis.del(CLAVE_CACHE_LISTA);
    return cliente;
  }

  async actualizarEstado(id: string, dto: ActualizarEstadoDto) {
    await this.obtener(id);
    const cliente = await this.prisma.cliente.update({
      where: { id },
      data: { activo: dto.activo },
    });
    await this.redis.del(CLAVE_CACHE_LISTA);
    return cliente;
  }

  async eliminar(id: string) {
    await this.obtener(id);
    await this.prisma.cliente.delete({ where: { id } });
    await this.redis.del(CLAVE_CACHE_LISTA);
    return { eliminado: true };
  }

  async obtenerHistorial(id: string, usuarioId: string) {
    // Validar primero que el cliente exista
    await this.obtener(id);

    const cotizacionesUrl = this.config.get<string>("COTIZACIONES_URL") ?? "http://localhost:4004";
    const ventasUrl = this.config.get<string>("VENTAS_CAJA_URL") ?? "http://localhost:4005";

    let cotizaciones: unknown[] = [];
    let ventas: unknown[] = [];
    let parcial = false;
    const fuentesFallidas: string[] = [];

    // Llamada REST al microservicio de Cotizaciones
    try {
      cotizaciones = await this.http.get<unknown[]>(
        `${cotizacionesUrl}/cotizaciones?clienteId=${id}`,
        {
          usuarioId,
        },
      );
    } catch (error) {
      parcial = true;
      fuentesFallidas.push("cotizaciones");
    }

    // Llamada REST al microservicio de Ventas POS y Caja
    try {
      ventas = await this.http.get<unknown[]>(`${ventasUrl}/ventas?clienteId=${id}`, { usuarioId });
    } catch (error) {
      parcial = true;
      fuentesFallidas.push("ventas");
    }

    return {
      clienteId: id,
      cotizaciones,
      ventas,
      parcial,
      fuentesFallidas,
    };
  }
}
