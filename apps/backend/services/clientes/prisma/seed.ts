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
  {
    id: "c-006",
    nombre: "Abarrotera La Económica",
    rfc: "AEC050505TY5",
    telefono: "7776789012",
    correo: "compras@laeconomica.com",
    direccion: "Mercado López Mateos L-23",
    activo: true,
  },
  {
    id: "c-007",
    nombre: "Ana Torres Gómez",
    rfc: null,
    telefono: "7777890123",
    correo: "ana.torres@correo.com",
    direccion: "Av. Universidad 300, Cuernavaca",
    activo: false,
  },
  {
    id: "c-008",
    nombre: "Roberto Flores Castro",
    rfc: "FOCR920912UI6",
    telefono: "7778901234",
    correo: "roberto.flores@correo.com",
    direccion: "Calle Galeana 88, Emiliano Zapata",
    activo: true,
  },
  {
    id: "c-009",
    nombre: "Distribuidora Morelos SA",
    rfc: "DMO070707OP7",
    telefono: "7779012345",
    correo: "contacto@distmorelos.com",
    direccion: "Parque Industrial CIVAC, Jiutepec",
    activo: true,
  },
  {
    id: "c-010",
    nombre: "Sofía Ramírez Vega",
    rfc: null,
    telefono: "7770123456",
    correo: "sofia.ramirez@correo.com",
    direccion: "Col. Centro, Yautepec",
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
