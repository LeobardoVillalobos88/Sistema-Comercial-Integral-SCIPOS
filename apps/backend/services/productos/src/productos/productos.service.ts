import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import type { ActualizarProductoDto } from "./dto/actualizar-producto.dto";
import type { AjustarStockDto } from "./dto/ajustar-stock.dto";
import type { CambiarEstadoProductoDto } from "./dto/cambiar-estado-producto.dto";
import type { CrearProductoDto } from "./dto/crear-producto.dto";

const CLAVE_CACHE_LISTA = "productos:lista";
/** Bajo este umbral de existencia, un producto cuenta como "stock bajo" en el resumen. */
const UMBRAL_STOCK_BAJO = 10;
/** Ventana de días para considerar un lote "próximo a caducar" en el resumen. */
const DIAS_PROXIMO_A_CADUCAR = 30;

export interface FiltrosListado {
  estado?: "ACTIVO" | "INACTIVO";
  tipo?: "PRODUCTO" | "SERVICIO";
}

@Injectable()
export class ProductosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async crear(dto: CrearProductoDto) {
    const producto = await this.prisma.producto.create({
      data: {
        lote: dto.lote.trim(),
        nombre: dto.nombre.trim(),
        tipo: dto.tipo,
        precioCompra: dto.precioCompra,
        precioVenta: dto.precioVenta,
        existencia: dto.existencia ?? 0,
        fechaCaducidad: dto.fechaCaducidad ? new Date(dto.fechaCaducidad) : null,
      },
    });
    await this.redis.del(CLAVE_CACHE_LISTA);
    return producto;
  }

  async listar(filtros: FiltrosListado) {
    let productos = await this.redis.get<unknown[]>(CLAVE_CACHE_LISTA);
    if (!productos) {
      productos = await this.prisma.producto.findMany({ orderBy: { nombre: "asc" } });
      await this.redis.set(CLAVE_CACHE_LISTA, productos, 30);
    }
    return (productos as Array<{ activo: boolean; tipo: string }>).filter((producto) => {
      const coincideEstado =
        !filtros.estado || (filtros.estado === "ACTIVO" ? producto.activo : !producto.activo);
      const coincideTipo = !filtros.tipo || producto.tipo === filtros.tipo;
      return coincideEstado && coincideTipo;
    });
  }

  async obtener(id: string) {
    const producto = await this.prisma.producto.findUnique({ where: { id } });
    if (!producto) {
      throw new NotFoundException(`El producto "${id}" no existe.`);
    }
    return producto;
  }

  async actualizar(id: string, dto: ActualizarProductoDto) {
    await this.obtener(id);
    const producto = await this.prisma.producto.update({
      where: { id },
      data: {
        lote: dto.lote?.trim(),
        nombre: dto.nombre?.trim(),
        tipo: dto.tipo,
        precioCompra: dto.precioCompra,
        precioVenta: dto.precioVenta,
        existencia: dto.existencia,
        fechaCaducidad: dto.fechaCaducidad ? new Date(dto.fechaCaducidad) : undefined,
      },
    });
    await this.redis.del(CLAVE_CACHE_LISTA);
    return producto;
  }

  async cambiarEstado(id: string, dto: CambiarEstadoProductoDto) {
    await this.obtener(id);
    const producto = await this.prisma.producto.update({
      where: { id },
      data: { activo: dto.activo },
    });
    await this.redis.del(CLAVE_CACHE_LISTA);
    return producto;
  }

  async eliminar(id: string) {
    await this.obtener(id);
    try {
      await this.prisma.producto.delete({ where: { id } });
    } catch (error) {
      if (this.esErrorDeReferencia(error)) {
        throw new ConflictException(
          "No se puede eliminar: el producto tiene compras registradas. Desactívalo en su lugar.",
        );
      }
      throw error;
    }
    await this.redis.del(CLAVE_CACHE_LISTA);
    return { eliminado: true };
  }

  /** Ajuste genérico de stock (RNF-14): lo usan otros servicios para descontar o reponer existencias. */
  async ajustarStock(id: string, dto: AjustarStockDto) {
    const producto = await this.obtener(id);
    const nuevaExistencia = producto.existencia + dto.delta;
    if (nuevaExistencia < 0) {
      throw new BadRequestException(
        `El ajuste dejaría existencia negativa (actual: ${producto.existencia}, delta: ${dto.delta}).`,
      );
    }
    const actualizado = await this.prisma.producto.update({
      where: { id },
      data: { existencia: nuevaExistencia },
    });
    await this.redis.del(CLAVE_CACHE_LISTA);
    return actualizado;
  }

  /** Resumen para el dashboard: productos activos, stock bajo y próximos a caducar. */
  async resumen() {
    const limiteCaducidad = new Date();
    limiteCaducidad.setDate(limiteCaducidad.getDate() + DIAS_PROXIMO_A_CADUCAR);

    const [productosActivos, stockBajo, proximosACaducar] = await Promise.all([
      this.prisma.producto.count({ where: { activo: true } }),
      this.prisma.producto.count({
        where: { activo: true, tipo: "PRODUCTO", existencia: { lte: UMBRAL_STOCK_BAJO } },
      }),
      this.prisma.producto.count({
        where: {
          activo: true,
          fechaCaducidad: { not: null, lte: limiteCaducidad, gte: new Date() },
        },
      }),
    ]);

    return { productosActivos, stockBajo, proximosACaducar };
  }

  private esErrorDeReferencia(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2003"
    );
  }
}
