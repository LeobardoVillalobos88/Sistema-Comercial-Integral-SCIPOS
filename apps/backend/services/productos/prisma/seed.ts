import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from ".prisma/client";

/**
 * Semilla del servicio de productos. Usa los mismos IDs que
 * `PRODUCTOS_MOCK` en `apps/frontend/commons/src/mocks/productos.ts`, que
 * los servicios de cotizaciones y ventas referencian en sus semillas.
 */
const PRODUCTOS = [
  {
    id: "p-001",
    lote: "ABA-001",
    nombre: "Abarrote surtido 1kg",
    tipo: "PRODUCTO",
    precioCompra: 29.5,
    precioVenta: 45.5,
    existencia: 120,
    fechaCaducidad: "2026-11-30",
    activo: true,
  },
  {
    id: "p-002",
    lote: "BEB-010",
    nombre: "Refresco 600ml",
    tipo: "PRODUCTO",
    precioCompra: 11.7,
    precioVenta: 18.0,
    existencia: 240,
    fechaCaducidad: "2026-09-15",
    activo: true,
  },
  {
    id: "p-004",
    lote: "PAN-020",
    nombre: "Pan de caja grande",
    tipo: "PRODUCTO",
    precioCompra: 25.3,
    precioVenta: 38.9,
    existencia: 60,
    fechaCaducidad: "2026-08-05",
    activo: true,
  },
  {
    id: "p-005",
    lote: "LAC-030",
    nombre: "Leche entera 1L",
    tipo: "PRODUCTO",
    precioCompra: 17.9,
    precioVenta: 27.5,
    existencia: 80,
    fechaCaducidad: "2026-07-25",
    activo: true,
  },
  {
    id: "p-006",
    lote: "LIM-040",
    nombre: "Detergente 1kg",
    tipo: "PRODUCTO",
    precioCompra: 33.8,
    precioVenta: 52.0,
    existencia: 45,
    fechaCaducidad: "2028-03-10",
    activo: true,
  },
  {
    id: "p-008",
    lote: "PAP-050",
    nombre: "Papel higiénico 4 rollos",
    tipo: "PRODUCTO",
    precioCompra: 21.5,
    precioVenta: 33.0,
    existencia: 90,
    fechaCaducidad: "2029-06-01",
    activo: true,
  },
  {
    id: "p-013",
    lote: "SRV-100",
    nombre: "Servicio de paquetería",
    tipo: "SERVICIO",
    precioCompra: 0,
    precioVenta: 65.0,
    existencia: 0,
    activo: true,
  },
] as const;

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  // El adapter de pg no lee el parámetro ?schema= de la URL; hay que pasarlo aparte.
  const schema = new URL(url).searchParams.get("schema") ?? undefined;
  const adapter = new PrismaPg({ connectionString: url }, schema ? { schema } : undefined);
  const prisma = new PrismaClient({ adapter });

  for (const producto of PRODUCTOS) {
    const datos = {
      lote: producto.lote,
      nombre: producto.nombre,
      tipo: producto.tipo,
      precioCompra: producto.precioCompra,
      precioVenta: producto.precioVenta,
      existencia: producto.existencia,
      fechaCaducidad: "fechaCaducidad" in producto ? new Date(producto.fechaCaducidad) : null,
      activo: producto.activo,
    };
    await prisma.producto.upsert({
      where: { id: producto.id },
      update: datos,
      create: { id: producto.id, ...datos },
    });
  }

  console.log("Semilla de productos aplicada:", { productos: await prisma.producto.count() });
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Error al aplicar la semilla de productos:", error);
  process.exit(1);
});
