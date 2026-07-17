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

  async historialPorCliente(clienteId: string) {
    const ventas = await this.prisma.venta.findMany({
      where: { clienteId },
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

    const totales = calcularTotalesVenta(dto.partidas, descuentoSolicitado);
    await this.descontarStock(dto.partidas, opciones.usuarioId);

    const venta = await this.prisma.venta.create({
      data: {
        cajaId: caja.id,
        clienteId: dto.clienteId,
        cotizacionId: opciones.cotizacionId,
        descuento: totales.descuentoEfectivo,
        iva: totales.iva,
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
      iva: number;
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
      iva: venta.iva,
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
