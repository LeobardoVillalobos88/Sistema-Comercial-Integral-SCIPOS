import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from ".prisma/client";

/**
 * Semilla de la plantilla. En tu servicio, siembra aquí los datos de tu
 * dominio usando los mismos IDs que los mocks del frontend.
 */
const EJEMPLOS = [
  {
    id: "ejemplo-1",
    nombre: "Primer ejemplo",
    descripcion: "Registro de muestra para probar el servicio.",
  },
  {
    id: "ejemplo-2",
    nombre: "Segundo ejemplo",
    descripcion: "Otro registro de muestra.",
  },
];

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  // El adapter de pg no lee el parámetro ?schema= de la URL; hay que pasarlo aparte.
  const schema = new URL(url).searchParams.get("schema") ?? undefined;
  const adapter = new PrismaPg({ connectionString: url }, schema ? { schema } : undefined);
  const prisma = new PrismaClient({ adapter });

  for (const ejemplo of EJEMPLOS) {
    await prisma.ejemplo.upsert({
      where: { id: ejemplo.id },
      update: { nombre: ejemplo.nombre, descripcion: ejemplo.descripcion },
      create: ejemplo,
    });
  }

  console.log("Semilla aplicada:", { ejemplos: await prisma.ejemplo.count() });
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Error al aplicar la semilla:", error);
  process.exit(1);
});
