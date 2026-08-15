import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { EstadoCotizacion, PrismaClient } from ".prisma/client";

const cotizaciones = [
  {
    id: "cot-001",
    folio: "COT-000001",
    clienteId: "c-001",
    clienteNombre: "María González López",
    estado: EstadoCotizacion.BORRADOR,
    subtotal: "145.00",
    iva: "23.20",
    total: "168.20",
    ventaId: null,
    creadaEn: new Date("2026-07-14T15:00:00.000Z"),
    partidas: [
      {
        productoId: "p-001",
        productoNombre: "Abarrote surtido 1kg",
        cantidad: 2,
        precioUnitario: "45.50",
        importe: "91.00",
      },
      {
        productoId: "p-002",
        productoNombre: "Refresco 600ml",
        cantidad: 3,
        precioUnitario: "18.00",
        importe: "54.00",
      },
    ],
  },
  {
    id: "cot-002",
    folio: "COT-000002",
    clienteId: "c-003",
    clienteNombre: "Comercializadora del Sur SA de CV",
    estado: EstadoCotizacion.ENVIADA,
    subtotal: "392.00",
    iva: "62.72",
    total: "454.72",
    ventaId: null,
    creadaEn: new Date("2026-07-15T17:30:00.000Z"),
    partidas: [
      {
        productoId: "p-006",
        productoNombre: "Detergente 1kg",
        cantidad: 5,
        precioUnitario: "52.00",
        importe: "260.00",
      },
      {
        productoId: "p-008",
        productoNombre: "Papel higiénico 4 rollos",
        cantidad: 4,
        precioUnitario: "33.00",
        importe: "132.00",
      },
    ],
  },
  {
    id: "cot-003",
    folio: "COT-000003",
    clienteId: "c-002",
    clienteNombre: "Juan Pérez Hernández",
    estado: EstadoCotizacion.VENDIDA,
    subtotal: "242.80",
    iva: "38.85",
    total: "281.65",
    ventaId: "v-001",
    creadaEn: new Date("2026-07-16T13:00:00.000Z"),
    partidas: [
      {
        productoId: "p-004",
        productoNombre: "Pan de caja grande",
        cantidad: 2,
        precioUnitario: "38.90",
        importe: "77.80",
      },
      {
        productoId: "p-005",
        productoNombre: "Leche entera 1L",
        cantidad: 6,
        precioUnitario: "27.50",
        importe: "165.00",
      },
    ],
  },
];

async function sembrar(): Promise<void> {
  const url = process.env.DATABASE_URL ?? "";
  const schema = new URL(url).searchParams.get("schema") ?? undefined;
  const adapter = new PrismaPg({ connectionString: url }, schema ? { schema } : undefined);
  const prisma = new PrismaClient({ adapter });

  for (const cotizacion of cotizaciones) {
    const { partidas, ...datos } = cotizacion;
    await prisma.cotizacion.upsert({
      where: { id: cotizacion.id },
      create: { ...datos, partidas: { create: partidas } },
      update: {
        ...datos,
        partidas: { deleteMany: {}, create: partidas },
      },
    });
  }

  await prisma.secuenciaFolio.upsert({
    where: { clave: "COTIZACION" },
    create: { clave: "COTIZACION", ultimo: cotizaciones.length },
    update: { ultimo: cotizaciones.length },
  });

  console.log("Semilla de cotizaciones aplicada:", {
    cotizaciones: await prisma.cotizacion.count(),
  });
  await prisma.$disconnect();
}

sembrar().catch((error: unknown) => {
  console.error("Error al aplicar la semilla de cotizaciones:", error);
  process.exit(1);
});
