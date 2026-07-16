import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import type { CrearCompraDto } from "./dto/crear-compra.dto";

const CLAVE_CACHE_LISTA_PRODUCTOS = "productos:lista";

@Injectable()
export class ComprasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /** Registra una compra e incrementa existencias en una sola transacción (RF-36). */
  async crear(dto: CrearCompraDto) {
    const productoIds = dto.partidas.map((partida) => partida.productoId);
    const productos = await this.prisma.producto.findMany({ where: { id: { in: productoIds } } });
    const mapaProductos = new Map(productos.map((producto) => [producto.id, producto]));

    for (const partida of dto.partidas) {
      if (!mapaProductos.has(partida.productoId)) {
        throw new NotFoundException(`El producto "${partida.productoId}" no existe.`);
      }
    }

    const partidas = dto.partidas.map((partida) => {
      const producto = mapaProductos.get(partida.productoId);
      const precioCompra = partida.precioCompra ?? producto?.precioCompra ?? 0;
      return { ...partida, precioCompra };
    });
    const total = partidas.reduce(
      (suma, partida) => suma + partida.cantidad * partida.precioCompra,
      0,
    );

    const compra = await this.prisma.$transaction(async (tx) => {
      const creada = await tx.compra.create({
        data: {
          proveedor: dto.proveedor,
          total,
          partidas: {
            create: partidas.map((partida) => ({
              productoId: partida.productoId,
              cantidad: partida.cantidad,
              precioCompra: partida.precioCompra,
            })),
          },
        },
        include: { partidas: true },
      });

      for (const partida of partidas) {
        await tx.producto.update({
          where: { id: partida.productoId },
          data: { existencia: { increment: partida.cantidad } },
        });
      }

      return creada;
    });

    await this.redis.del(CLAVE_CACHE_LISTA_PRODUCTOS);
    return compra;
  }
}
