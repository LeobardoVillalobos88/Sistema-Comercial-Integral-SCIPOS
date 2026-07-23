import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from ".prisma/client";

const CLIENTES = [
  {
    id: "c-001",
    nombre: "María González López",
    rfc: "GOLM850101AB1",
    telefono: "7771234567",
    correo: "maria.gonzalez@correo.com",
    direccion: "Av. Morelos 123, Cuernavaca",
    activo: true,
  },
  {
    id: "c-002",
    nombre: "Juan Pérez Hernández",
    rfc: "PEHJ900215XY2",
    telefono: "7772345678",
    correo: "juan.perez@correo.com",
    direccion: "Calle Juárez 45, Jiutepec",
    activo: true,
  },
  {
    id: "c-003",
    nombre: "Comercializadora del Sur SA de CV",
    rfc: "CSU101010QW3",
    telefono: "7773456789",
    correo: "ventas@comersur.com",
    direccion: "Blvd. Cuauhnáhuac 980, Jiutepec",
    activo: true,
  },
  {
    id: "c-004",
    nombre: "Laura Martínez Ruiz",
    rfc: null,
    telefono: "7774567890",
    correo: "laura.martinez@correo.com",
    direccion: "Privada Las Flores 12, Temixco",
    activo: true,
  },
  {
    id: "c-005",
    nombre: "Pedro Sánchez Díaz",
    rfc: "SADP880730ER4",
    telefono: "7775678901",
    correo: "pedro.sanchez@correo.com",
    direccion: "Calle 5 de Mayo 67, Cuernavaca",
    activo: true,
  },
];

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  const schema = new URL(url).searchParams.get("schema") ?? undefined;
  const adapter = new PrismaPg({ connectionString: url }, schema ? { schema } : undefined);
  const prisma = new PrismaClient({ adapter });

  for (const cliente of CLIENTES) {
    await prisma.cliente.upsert({
      where: { id: cliente.id },
      update: {
        nombre: cliente.nombre,
        rfc: cliente.rfc,
        telefono: cliente.telefono,
        correo: cliente.correo,
        direccion: cliente.direccion,
        activo: cliente.activo,
      },
      create: cliente,
    });
  }

  console.log("Semilla aplicada:", { clientes: await prisma.cliente.count() });
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Error al aplicar la semilla:", error);
  process.exit(1);
});
