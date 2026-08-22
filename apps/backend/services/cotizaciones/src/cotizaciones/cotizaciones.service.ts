import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EstadoCotizacion, type Prisma } from ".prisma/client";

import { ClientesClient } from "../integraciones/clientes.client";
import { ProductosClient } from "../integraciones/productos.client";
import { VentasClient } from "../integraciones/ventas.client";
import { PrismaService } from "../prisma/prisma.service";
import { calcularTotales } from "./calculos-cotizacion";
import { mapearCotizacion } from "./cotizaciones.mapper";
import type { CrearCotizacionDto } from "./dto/crear-cotizacion.dto";
import type { FiltrarCotizacionesDto } from "./dto/filtrar-cotizaciones.dto";
import type { CotizacionRespuestaDto, ResumenCotizacionesRespuestaDto } from "./dto/respuestas.dto";

const INCLUIR_PARTIDAS = { partidas: { orderBy: { id: "asc" as const } } };

@Injectable()
export class CotizacionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientes: ClientesClient,
    private readonly productos: ProductosClient,
    private readonly ventas: VentasClient,
    config: ConfigService,
  ) {}

  async crear(dto: CrearCotizacionDto, usuarioId: string): Promise<CotizacionRespuestaDto> {
    this.validarProductosUnicos(dto);
    const [cliente, productos] = await Promise.all([
      this.clientes.obtenerActivo(dto.clienteId, usuarioId),
      Promise.all(
        dto.partidas.map((partida) => this.productos.obtenerActivo(partida.productoId, usuarioId)),
      ),
    ]);

    if (!cliente.nombre?.trim()) {
      throw new UnprocessableEntityException(
        "El servicio de clientes no devolvió un nombre válido",
      );
    }

    let calculo: ReturnType<typeof calcularTotales>;
    try {
      calculo = calcularTotales(
        dto.partidas.map((partida, indice) => ({
          productoId: partida.productoId,
          productoNombre: productos[indice]?.nombre ?? "",
          cantidad: partida.cantidad,
          precioUnitario: productos[indice]?.precioVenta ?? Number.NaN,
        })),
      );
    } catch {
      throw new UnprocessableEntityException("Uno de los productos tiene un precio inválido");
    }

    const cotizacion = await this.prisma.$transaction(async (tx) => {
      const secuencia = await tx.secuenciaFolio.upsert({
        where: { clave: "COTIZACION" },
        create: { clave: "COTIZACION", ultimo: 1 },
        update: { ultimo: { increment: 1 } },
      });

      return tx.cotizacion.create({
        data: {
          folio: `COT-${String(secuencia.ultimo).padStart(6, "0")}`,
          clienteId: cliente.id,
          clienteNombre: cliente.nombre.trim(),
          subtotal: calculo.subtotal,
          total: calculo.total,
          partidas: {
            create: calculo.partidas.map((partida) => ({
              productoId: partida.productoId,
              productoNombre: partida.productoNombre,
              cantidad: partida.cantidad,
              precioUnitario: partida.precioUnitario,
              importe: partida.importe,
            })),
          },
        },
        include: INCLUIR_PARTIDAS,
      });
    });

    return mapearCotizacion(cotizacion);
  }

  async listar(filtros: FiltrarCotizacionesDto): Promise<CotizacionRespuestaDto[]> {
    const where = this.construirFiltros(filtros);
    const datos = await this.prisma.cotizacion.findMany({
      where,
      include: INCLUIR_PARTIDAS,
      orderBy: { creadaEn: "desc" },
    });
    return datos.map(mapearCotizacion);
  }

  async listarPorCliente(
    clienteId: string,
    filtros: FiltrarCotizacionesDto,
  ): Promise<CotizacionRespuestaDto[]> {
    return this.listar({ ...filtros, clienteId });
  }

  async obtener(id: string): Promise<CotizacionRespuestaDto> {
    const cotizacion = await this.prisma.cotizacion.findUnique({
      where: { id },
      include: INCLUIR_PARTIDAS,
    });
    if (!cotizacion) {
      throw new NotFoundException(`No existe la cotización ${id}`);
    }
    return mapearCotizacion(cotizacion);
  }

  async enviar(id: string): Promise<CotizacionRespuestaDto> {
    const resultado = await this.prisma.cotizacion.updateMany({
      where: { id, estado: EstadoCotizacion.BORRADOR },
      data: { estado: EstadoCotizacion.ENVIADA },
    });
    if (resultado.count === 0) {
      await this.lanzarErrorDeEstado(id, EstadoCotizacion.BORRADOR, "enviar");
    }
    return this.obtener(id);
  }

  async eliminar(id: string): Promise<CotizacionRespuestaDto> {
    const existente = await this.prisma.cotizacion.findUnique({
      where: { id },
      include: INCLUIR_PARTIDAS,
    });
    if (!existente) {
      throw new NotFoundException(`No existe la cotización ${id}`);
    }
    if (existente.estado !== EstadoCotizacion.BORRADOR) {
      throw new ConflictException("Solo se pueden eliminar cotizaciones en estado BORRADOR");
    }

    const resultado = await this.prisma.cotizacion.deleteMany({
      where: { id, estado: EstadoCotizacion.BORRADOR },
    });
    if (resultado.count === 0) {
      throw new ConflictException("La cotización cambió de estado antes de poder eliminarse");
    }
    return mapearCotizacion(existente);
  }

  async convertir(id: string, usuarioId: string): Promise<CotizacionRespuestaDto> {
    return this.prisma.$transaction(
      async (tx) => {
        // Serializa conversiones del mismo ID sin depender del search_path del adapter de Prisma.
        await tx.$queryRaw`
          SELECT pg_advisory_xact_lock(hashtext(${id}))::text AS "bloqueo"
        `;

        const cotizacion = await tx.cotizacion.findUnique({
          where: { id },
          include: INCLUIR_PARTIDAS,
        });
        if (!cotizacion) {
          throw new NotFoundException(`No existe la cotización ${id}`);
        }
        if (cotizacion.estado === EstadoCotizacion.VENDIDA) {
          return mapearCotizacion(cotizacion);
        }
        if (cotizacion.estado !== EstadoCotizacion.ENVIADA) {
          throw new ConflictException("La cotización debe estar ENVIADA antes de convertirla");
        }

        const venta = await this.ventas.crearDesdeCotizacion(
          {
            cotizacionId: cotizacion.id,
            folioCotizacion: cotizacion.folio,
            clienteId: cotizacion.clienteId,
            subtotal: cotizacion.subtotal.toNumber(),
            total: cotizacion.total.toNumber(),
            partidas: cotizacion.partidas.map((partida) => ({
              productoId: partida.productoId,
              cantidad: partida.cantidad,
              precioUnitario: partida.precioUnitario.toNumber(),
              importe: partida.importe.toNumber(),
            })),
          },
          usuarioId,
        );

        const vendida = await tx.cotizacion.update({
          where: { id },
          data: { estado: EstadoCotizacion.VENDIDA, ventaId: venta.id },
          include: INCLUIR_PARTIDAS,
        });
        return mapearCotizacion(vendida);
      },
      { maxWait: 2_000, timeout: 10_000 },
    );
  }

  async resumen(
    filtros: Pick<FiltrarCotizacionesDto, "desde" | "hasta">,
  ): Promise<ResumenCotizacionesRespuestaDto> {
    const where = this.construirFiltros(filtros);
    const [porEstado, ventas] = await Promise.all([
      this.prisma.cotizacion.groupBy({
        by: ["estado"],
        where,
        _count: { _all: true },
      }),
      this.prisma.cotizacion.aggregate({
        where: { ...where, estado: EstadoCotizacion.VENDIDA },
        _sum: { total: true },
      }),
    ]);
    const conteo = new Map(porEstado.map((fila) => [fila.estado, fila._count._all]));
    const borrador = conteo.get(EstadoCotizacion.BORRADOR) ?? 0;
    const enviadas = conteo.get(EstadoCotizacion.ENVIADA) ?? 0;
    const vendidas = conteo.get(EstadoCotizacion.VENDIDA) ?? 0;
    return {
      borrador,
      enviadas,
      vendidas,
      total: borrador + enviadas + vendidas,
      montoVendido: ventas._sum.total?.toNumber() ?? 0,
    };
  }

  private construirFiltros(filtros: FiltrarCotizacionesDto): Prisma.CotizacionWhereInput {
    const desde = filtros.desde ? this.convertirFecha(filtros.desde, false) : undefined;
    const hasta = filtros.hasta ? this.convertirFecha(filtros.hasta, true) : undefined;
    if (desde && hasta && desde > hasta) {
      throw new BadRequestException("La fecha desde no puede ser posterior a la fecha hasta");
    }

    return {
      estado: filtros.estado,
      clienteId: filtros.clienteId,
      creadaEn: desde || hasta ? { gte: desde, lte: hasta } : undefined,
      OR: filtros.busqueda
        ? [
            { folio: { contains: filtros.busqueda, mode: "insensitive" } },
            { clienteNombre: { contains: filtros.busqueda, mode: "insensitive" } },
          ]
        : undefined,
    };
  }

  private convertirFecha(valor: string, finDelDia: boolean): Date {
    if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      return new Date(`${valor}T${finDelDia ? "23:59:59.999" : "00:00:00.000"}Z`);
    }
    return new Date(valor);
  }

  private validarProductosUnicos(dto: CrearCotizacionDto): void {
    const ids = dto.partidas.map((partida) => partida.productoId);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException("No se puede repetir un producto en las partidas");
    }
  }

  private async lanzarErrorDeEstado(
    id: string,
    esperado: EstadoCotizacion,
    accion: string,
  ): Promise<never> {
    const cotizacion = await this.prisma.cotizacion.findUnique({ where: { id } });
    if (!cotizacion) {
      throw new NotFoundException(`No existe la cotización ${id}`);
    }
    throw new ConflictException(
      `No se puede ${accion} una cotización en estado ${cotizacion.estado}; se esperaba ${esperado}`,
    );
  }
}
