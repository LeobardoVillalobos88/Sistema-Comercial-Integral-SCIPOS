import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { redondearMoneda } from "../utils/calculos-venta";
import type { AbrirCajaDto } from "./dto/abrir-caja.dto";
import type { RegistrarMovimientoCajaDto } from "./dto/registrar-movimiento.dto";

@Injectable()
export class CajaService {
  constructor(private readonly prisma: PrismaService) {}

  /** Cortes realizados: turnos de caja ya cerrados, del más reciente al más antiguo. */
  async listarCortes() {
    return this.prisma.caja.findMany({
      where: { estado: "CERRADA" },
      orderBy: { fechaCierre: "desc" },
    });
  }

  /** Obtiene el turno de caja actualmente abierto, si existe. */
  async obtenerCajaAbierta() {
    return this.prisma.caja.findFirst({
      where: { estado: "ABIERTA" },
      orderBy: { fechaApertura: "desc" },
    });
  }

  /**
   * Estado del turno actual: si hay caja abierta, incluye sus movimientos y
   * el acumulado de ventas. Lo usa el frontend para hidratarse al cargar.
   */
  async estado() {
    const caja = await this.obtenerCajaAbierta();
    if (!caja) {
      return { abierta: false, caja: null, movimientos: [], ventasTurno: 0 };
    }
    const [movimientos, ventas] = await Promise.all([
      this.prisma.movimientoCaja.findMany({
        where: { cajaId: caja.id },
        orderBy: { fecha: "desc" },
      }),
      this.prisma.venta.aggregate({
        where: { cajaId: caja.id, estado: "COMPLETA" },
        _sum: { total: true },
      }),
    ]);
    return {
      abierta: true,
      caja,
      movimientos,
      ventasTurno: redondearMoneda(ventas._sum.total ?? 0),
    };
  }

  /** Exige que exista una caja abierta; lanza 400 si no hay turno activo. */
  async exigirCajaAbierta() {
    const caja = await this.obtenerCajaAbierta();
    if (!caja) {
      throw new BadRequestException(
        "No hay una caja abierta. Debes abrir turno antes de registrar ventas.",
      );
    }
    return caja;
  }

  async abrir(dto: AbrirCajaDto) {
    const cajaAbierta = await this.obtenerCajaAbierta();
    if (cajaAbierta) {
      throw new BadRequestException(
        "Ya existe un turno de caja abierto. Ciérralo antes de abrir uno nuevo.",
      );
    }

    return this.prisma.caja.create({
      data: {
        montoInicial: dto.montoInicial,
        estado: "ABIERTA",
      },
    });
  }

  async registrarMovimiento(dto: RegistrarMovimientoCajaDto) {
    const caja = await this.exigirCajaAbierta();

    return this.prisma.movimientoCaja.create({
      data: {
        cajaId: caja.id,
        tipo: dto.tipo,
        monto: dto.monto,
        motivo: dto.motivo.trim(),
      },
    });
  }

  /**
   * Realiza el corte de caja: suma ventas completas del turno, ingresos y
   * egresos manuales, y persiste el monto final calculado.
   */
  async cerrar() {
    const caja = await this.exigirCajaAbierta();

    const [ventasTurno, ingresosManual, egresosManual] = await Promise.all([
      this.prisma.venta.aggregate({
        where: { cajaId: caja.id, estado: "COMPLETA" },
        _sum: { total: true },
      }),
      this.prisma.movimientoCaja.aggregate({
        where: { cajaId: caja.id, tipo: "INGRESO" },
        _sum: { monto: true },
      }),
      this.prisma.movimientoCaja.aggregate({
        where: { cajaId: caja.id, tipo: "EGRESO" },
        _sum: { monto: true },
      }),
    ]);

    const totalVentas = ventasTurno._sum.total ?? 0;
    const totalIngresos = ingresosManual._sum.monto ?? 0;
    const totalEgresos = egresosManual._sum.monto ?? 0;
    const totalCierre = redondearMoneda(
      caja.montoInicial + totalVentas + totalIngresos - totalEgresos,
    );

    const cajaCerrada = await this.prisma.caja.update({
      where: { id: caja.id },
      data: {
        estado: "CERRADA",
        montoFinal: totalCierre,
        fechaCierre: new Date(),
      },
    });

    return {
      caja: cajaCerrada,
      ventasTurno: redondearMoneda(totalVentas),
      ingresosManual: redondearMoneda(totalIngresos),
      egresosManual: redondearMoneda(totalEgresos),
      totalCierre,
    };
  }
}
