import { execSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Deja el proyecto listo para arrancar en una máquina nueva: comprueba los
 * requisitos, crea los .env que faltan y llama a `pnpm setup:backend`.
 *
 * Lo que hace y `setup:backend` no es copiar los archivos de entorno. Ese era
 * el paso manual del README —siete copias, una por servicio— y el único que
 * falla en silencio: sin .env, Prisma no encuentra DATABASE_URL y el error
 * aparece a mitad de las migraciones, lejos de su causa.
 */

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const SERVICIOS = [
  "apps/backend/gateway",
  "apps/backend/services/seguridad",
  "apps/backend/services/productos",
  "apps/backend/services/clientes",
  "apps/backend/services/cotizaciones",
  "apps/backend/services/ventas-caja",
  "apps/backend/services/reportes",
];

function abortar(mensaje, comoResolver) {
  console.error(`\n  ERROR: ${mensaje}`);
  console.error(`  ${comoResolver}\n`);
  process.exit(1);
}

function comprobarRequisitos() {
  const mayorDeNode = Number(process.versions.node.split(".")[0]);
  if (mayorDeNode < 22) {
    abortar(
      `Node ${process.versions.node} es demasiado antiguo; hace falta 22 o superior.`,
      "pnpm 11 usa node:sqlite, que no existe antes de Node 22.5, así que ni la instalación funciona.",
    );
  }

  try {
    execSync("docker info", { stdio: "ignore" });
  } catch {
    abortar(
      "Docker no responde.",
      "Abre Docker Desktop y espera a que el icono deje de moverse; PostgreSQL y Redis corren ahí.",
    );
  }

  console.log(`  Node ${process.versions.node} y Docker disponibles.`);
}

function crearArchivosDeEntorno() {
  let creados = 0;
  for (const servicio of SERVICIOS) {
    const ejemplo = resolve(raiz, servicio, ".env.example");
    const destino = resolve(raiz, servicio, ".env");
    if (!existsSync(ejemplo)) {
      abortar(`Falta ${servicio}/.env.example`, "El repositorio está incompleto.");
    }
    // No se sobrescribe: si alguien ya ajustó su .env, sus valores mandan.
    if (existsSync(destino)) {
      continue;
    }
    copyFileSync(ejemplo, destino);
    creados += 1;
  }
  console.log(
    creados === 0
      ? "  Los .env ya existían; se conservan tal cual."
      : `  ${creados} archivos .env creados desde su .env.example.`,
  );
}

console.log("\nPreparando SCIPOS para desarrollo local\n");
comprobarRequisitos();
crearArchivosDeEntorno();

console.log("\n  Generando llaves, levantando contenedores, migrando y sembrando...");
console.log("  (la primera vez tarda unos minutos)\n");
execSync("pnpm setup:backend", { cwd: raiz, stdio: "inherit" });

console.log("\n  Listo. Arranca el sistema con:\n");
console.log("      pnpm dev\n");
console.log("  Y entra en http://localhost:3001 con admin@scipos.com / Admin1234\n");
