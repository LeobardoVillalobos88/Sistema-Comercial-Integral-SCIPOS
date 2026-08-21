import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ClienteHttp,
  PROVEEDOR_PRIVILEGIOS,
  type ProveedorPrivilegios,
} from "@scipos/backend-commons";
import { CajaService } from "../caja/caja.service";
import { PrismaService } from "../prisma/prisma.service";
import { calcularTotalesVenta } from "../utils/calculos-venta";
import type { ConvertirCotizacionDto } from "./dto/convertir-cotizacion.dto";
import type { CrearVentaDto } from "./dto/crear-venta.dto";
import type { PartidaVentaDto } from "./dto/partida-venta.dto";

interface OpcionesCrearVenta {
  cotizacionId?: string;
  usuarioId: string;
}

interface ProductoRemoto {
  id: string;
  nombre: string;
  precioVenta: number;
  activo: boolean;
}

@Injectable()
export class VentasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly caja: CajaService,
    private readonly http: ClienteHttp,
    private readonly config: ConfigService,
    @Inject(PROVEEDOR_PRIVILEGIOS) private readonly privilegios: ProveedorPrivilegios,
  ) {}

  async crear(dto: CrearVentaDto, usuarioId: string) {
    return this.registrarVenta(dto, { usuarioId });
  }

  async convertirCotizacion(dto: ConvertirCotizacionDto, usuarioId: string) {
    const existente = await this.prisma.venta.findUnique({
      where: { cotizacionId: dto.cotizacionId },
      include: { partidas: true },
    });
    if (existente) {
      return this.mapearVentaDetalle(existente);
    }
    return this.registrarVenta(dto, { usuarioId, cotizacionId: dto.cotizacionId });
  }

  async cancelar(id: string, usuarioId: string) {
    const venta = await this.prisma.venta.findUnique({
      where: { id },
      include: { partidas: true },
    });

    if (!venta) {
      throw new NotFoundException(`La venta con ID "${id}" no existe.`);
    }
    if (venta.estado === "CANCELADA") {
      throw new BadRequestException("La venta ya fue cancelada previamente.");
    }

    await this.reponerStock(venta.partidas, usuarioId);

    const ventaCancelada = await this.prisma.venta.update({
      where: { id },
      data: { estado: "CANCELADA" },
      include: { partidas: true },
    });

    return this.mapearVentaDetalle(ventaCancelada);
  }

  async resumen() {
    const inicioDelDia = new Date();
    inicioDelDia.setHours(0, 0, 0, 0);

    const [ventasHoy, cajaAbierta, ultimoCorte] = await Promise.all([
      this.prisma.venta.aggregate({
        where: { estado: "COMPLETA", fecha: { gte: inicioDelDia } },
        _sum: { total: true },
        _count: { _all: true },
      }),
      this.caja.obtenerCajaAbierta(),
      this.prisma.caja.findFirst({
        where: { estado: "CERRADA" },
        orderBy: { fechaCierre: "desc" },
      }),
    ]);

    return {
      ventasHoyTotal: ventasHoy._sum.total ?? 0,
      ventasHoyCantidad: ventasHoy._count._all,
      cajaAbierta: cajaAbierta !== null,
      ultimoCorteMonto: ultimoCorte?.montoFinal ?? null,
    };
  }

  async historialPorCliente(clienteId: string) {
    return this.listar({ clienteId });
  }

  async listar(filtros: { clienteId?: string; desde?: string; hasta?: string }) {
    const desde = filtros.desde ? new Date(`${filtros.desde}T00:00:00.000`) : undefined;
    const hasta = filtros.hasta ? new Date(`${filtros.hasta}T23:59:59.999`) : undefined;
    const ventas = await this.prisma.venta.findMany({
      where: {
        clienteId: filtros.clienteId || undefined,
        fecha: desde || hasta ? { gte: desde, lte: hasta } : undefined,
      },
      orderBy: { fecha: "desc" },
      include: { partidas: true },
    });

    return ventas.map((venta) => this.mapearVentaDetalle(venta));
  }

  private async registrarVenta(
    dto: CrearVentaDto | ConvertirCotizacionDto,
    opciones: OpcionesCrearVenta,
  ) {
    const caja = await this.caja.exigirCajaAbierta();
    const descuentoSolicitado = dto.descuento ?? 0;

    if (descuentoSolicitado > 0) {
      await this.validarPrivilegioDescuento(opciones.usuarioId);
    }

    const productos = await this.obtenerProductos(dto.partidas, opciones.usuarioId);
    const partidasConPrecio = dto.partidas.map((partida) => {
      const producto = productos.get(partida.productoId);
      if (!producto) {
        throw new NotFoundException(`El producto "${partida.productoId}" no existe.`);
      }
      if (!producto.activo) {
        throw new BadRequestException(`El producto "${producto.nombre}" está inactivo.`);
      }
      return {
        productoId: partida.productoId,
        cantidad: partida.cantidad,
        precioVenta: producto.precioVenta,
      };
    });

    const totales = calcularTotalesVenta(partidasConPrecio, descuentoSolicitado);
    await this.descontarStock(dto.partidas, opciones.usuarioId);

    const venta = await this.prisma.venta.create({
      data: {
        cajaId: caja.id,
        clienteId: dto.clienteId,
        cotizacionId: opciones.cotizacionId,
        descuento: totales.descuentoEfectivo,
        total: totales.total,
        partidas: {
          create: totales.partidas.map((partida) => ({
            productoId: partida.productoId,
            cantidad: partida.cantidad,
            precioVenta: partida.precioVenta,
            subtotal: partida.subtotal,
          })),
        },
      },
      include: { partidas: true },
    });

    return this.mapearVentaDetalle(venta, totales.subtotal);
  }

  private async validarPrivilegioDescuento(usuarioId: string) {
    const resultado = await this.privilegios.verificar(usuarioId, "pos:descuento");
    if (!resultado.tiene) {
      throw new ForbiddenException('No cuentas con el privilegio "pos:descuento".');
    }
  }

  private urlProductos() {
    return this.config.get<string>("PRODUCTOS_URL") ?? "http://localhost:4002";
  }

  private async obtenerProductos(
    partidas: PartidaVentaDto[],
    usuarioId: string,
  ): Promise<Map<string, ProductoRemoto>> {
    const base = this.urlProductos();
    const idsUnicos = [...new Set(partidas.map((partida) => partida.productoId))];
    const productos = await Promise.all(
      idsUnicos.map((id) =>
        this.http.get<ProductoRemoto>(`${base}/productos/${id}`, { usuarioId }),
      ),
    );
    return new Map(productos.map((producto) => [producto.id, producto]));
  }

  private async descontarStock(partidas: PartidaVentaDto[], usuarioId: string) {
    const base = this.urlProductos();
    for (const partida of partidas) {
      await this.http.post(
        `${base}/productos/${partida.productoId}/stock`,
        { delta: -partida.cantidad, motivo: "VENTA" },
        { usuarioId },
      );
    }
  }

  private async reponerStock(
    partidas: Array<{ productoId: string; cantidad: number }>,
    usuarioId: string,
  ) {
    const base = this.urlProductos();
    for (const partida of partidas) {
      await this.http.post(
        `${base}/productos/${partida.productoId}/stock`,
        { delta: partida.cantidad, motivo: "AJUSTE" },
        { usuarioId },
      );
    }
  }

  private mapearVentaDetalle(
    venta: {
      id: string;
      cajaId: string;
      clienteId: string;
      cotizacionId: string | null;
      descuento: number;
      total: number;
      estado: "COMPLETA" | "CANCELADA";
      fecha: Date;
      partidas: Array<{
        id: string;
        productoId: string;
        cantidad: number;
        precioVenta: number;
        subtotal: number;
      }>;
    },
    subtotalExplicito?: number,
  ) {
    const subtotal =
      subtotalExplicito ??
      venta.partidas.reduce((acumulado, partida) => acumulado + partida.subtotal, 0);

    return {
      id: venta.id,
      cajaId: venta.cajaId,
      clienteId: venta.clienteId,
      cotizacionId: venta.cotizacionId,
      subtotal: Math.round(subtotal * 100) / 100,
      descuento: venta.descuento,
      total: venta.total,
      estado: venta.estado,
      fecha: venta.fecha.toISOString(),
      partidas: venta.partidas.map((partida) => ({
        id: partida.id,
        productoId: partida.productoId,
        cantidad: partida.cantidad,
        precioVenta: partida.precioVenta,
        subtotal: partida.subtotal,
      })),
    };
  }
}
