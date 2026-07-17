import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from ".prisma/client";

/**
 * Semilla del servicio ventas-caja. Usa los mismos IDs que los mocks del
 * frontend (`VENTAS_POS_MOCK`, `CORTES_CAJA_MOCK` en pos-caja-front) y los
 * IDs de productos del servicio de productos (`p-00x`).
 */
const CAJA_HISTORICA = {
  id: "CORTE-HIST-001",
  montoInicial: 1000,
  montoFinal: 5298.25,
  fechaApertura: new Date("2026-06-30T08:00:00.000Z"),
  fechaCierre: new Date("2026-06-30T16:00:00.000Z"),
  estado: "CERRADA" as const,
};

const CAJA_HISTORICA_2 = {
  id: "CORTE-HIST-002",
  montoInicial: 1200,
  montoFinal: 5135.2,
  fechaApertura: new Date("2026-06-29T14:00:00.000Z"),
  fechaCierre: new Date("2026-06-29T22:00:00.000Z"),
  estado: "CERRADA" as const,
};

const VENTAS = [
  {
    id: "VTA-HIST-001",
    cajaId: CAJA_HISTORICA.id,
    clienteId: "c-001",
    descuento: 5,
    iva: 9.36,
    total: 67.86,
    estado: "COMPLETA" as const,
    fecha: new Date("2026-06-30T09:25:00.000Z"),
    partidas: [
      {
        id: "PART-VTA-001-1",
        productoId: "p-002",
        cantidad: 2,
        precioVenta: 18,
        subtotal: 36,
      },
      {
        id: "PART-VTA-001-2",
        productoId: "p-005",
        cantidad: 1,
        precioVenta: 27.5,
        subtotal: 27.5,
      },
    ],
  },
  {
    id: "VTA-HIST-002",
    cajaId: CAJA_HISTORICA.id,
    clienteId: "c-002",
    descuento: 0,
    iva: 13.9,
    total: 100.8,
    estado: "COMPLETA" as const,
    fecha: new Date("2026-06-30T11:12:00.000Z"),
    partidas: [
      {
        id: "PART-VTA-002-1",
        productoId: "p-004",
        cantidad: 1,
        precioVenta: 38.9,
        subtotal: 38.9,
      },
      {
        id: "PART-VTA-002-2",
        productoId: "p-006",
        cantidad: 3,
        precioVenta: 16,
        subtotal: 48,
      },
    ],
  },
];

const MOVIMIENTOS = [
  {
    id: "MOV-HIST-001",
    cajaId: CAJA_HISTORICA.id,
    tipo: "INGRESO" as const,
    monto: 150,
    motivo: "Fondo adicional para cambio",
    fecha: new Date("2026-06-30T10:00:00.000Z"),
  },
  {
    id: "MOV-HIST-002",
    cajaId: CAJA_HISTORICA.id,
    tipo: "EGRESO" as const,
    monto: 82.5,
    motivo: "Pago de servicios del local",
    fecha: new Date("2026-06-30T14:30:00.000Z"),
  },
  {
    id: "MOV-HIST-003",
    cajaId: CAJA_HISTORICA_2.id,
    tipo: "INGRESO" as const,
    monto: 200,
    motivo: "Depósito temporal",
    fecha: new Date("2026-06-29T16:00:00.000Z"),
  },
  {
    id: "MOV-HIST-004",
    cajaId: CAJA_HISTORICA_2.id,
    tipo: "EGRESO" as const,
    monto: 120,
    motivo: "Compra de insumos de limpieza",
    fecha: new Date("2026-06-29T20:00:00.000Z"),
  },
];

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  const schema = new URL(url).searchParams.get("schema") ?? undefined;
  const adapter = new PrismaPg({ connectionString: url }, schema ? { schema } : undefined);
  const prisma = new PrismaClient({ adapter });

  for (const caja of [CAJA_HISTORICA, CAJA_HISTORICA_2]) {
    await prisma.caja.upsert({
      where: { id: caja.id },
      update: {
        montoInicial: caja.montoInicial,
        montoFinal: caja.montoFinal,
        fechaApertura: caja.fechaApertura,
        fechaCierre: caja.fechaCierre,
        estado: caja.estado,
      },
      create: caja,
    });
  }

  for (const venta of VENTAS) {
    const { partidas, ...datosVenta } = venta;
    await prisma.venta.upsert({
      where: { id: venta.id },
      update: {
        ...datosVenta,
        partidas: {
          deleteMany: {},
          create: partidas,
        },
      },
      create: {
        ...datosVenta,
        partidas: { create: partidas },
      },
    });
  }

  for (const movimiento of MOVIMIENTOS) {
    await prisma.movimientoCaja.upsert({
      where: { id: movimiento.id },
      update: movimiento,
      create: movimiento,
    });
  }

  const [cajas, ventas, movimientos] = await Promise.all([
    prisma.caja.count(),
    prisma.venta.count(),
    prisma.movimientoCaja.count(),
  ]);

  console.log("Semilla aplicada:", { cajas, ventas, movimientos });
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Error al aplicar la semilla:", error);
  process.exit(1);
});
