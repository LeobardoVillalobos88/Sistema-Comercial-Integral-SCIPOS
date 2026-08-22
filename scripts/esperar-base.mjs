import { execSync } from "node:child_process";

/**
 * Espera a que PostgreSQL acepte conexiones antes de seguir.
 *
 * `docker compose up -d` devuelve en cuanto el contenedor arranca, no cuando la
 * base está lista para atender. En esos segundos, la primera migración falla
 * con un error de conexión que parece de configuración y no lo es.
 */

const INTENTOS = 60;
const ESPERA_MS = 1000;

function baseLista() {
  try {
    // Una consulta de verdad y no `pg_isready`: durante el arranque el servidor
    // llega a responder que está listo mientras todavía rechaza conexiones.
    execSync('docker exec scipos-db psql -U root -d scipos -c "SELECT 1"', { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

for (let intento = 1; intento <= INTENTOS; intento += 1) {
  if (baseLista()) {
    console.log("  PostgreSQL acepta conexiones.");
    process.exit(0);
  }
  if (intento === 1) {
    process.stdout.write("  Esperando a que PostgreSQL termine de arrancar");
  }
  process.stdout.write(".");
  // Espera bloqueante: este script corre solo, entre dos comandos de la cadena.
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ESPERA_MS);
}

console.error(
  `\n  ERROR: PostgreSQL no respondió tras ${INTENTOS} segundos.\n  Revisa que el contenedor esté arriba con: docker ps\n`,
);
process.exit(1);
