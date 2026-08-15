import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raizProyecto = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rutaPrivada = resolve(raizProyecto, "keys", "jwt_private.pem");
const rutaPublica = resolve(raizProyecto, "keys", "jwt_public.pem");

if (!existsSync(rutaPrivada) || !existsSync(rutaPublica)) {
  console.error("No hay llaves en keys/. Genéralas primero con: pnpm generar:llaves");
  process.exit(1);
}

const codificar = (ruta) =>
  Buffer.from(readFileSync(ruta, "utf8").trim(), "utf8").toString("base64");

console.log("# Copia estas dos líneas en el .env de la raíz del proyecto.");
console.log("# La llave privada es un secreto: no la compartas ni la subas al repositorio.");
console.log("");
console.log(`JWT_PRIVATE_KEY=${codificar(rutaPrivada)}`);
console.log(`JWT_PUBLIC_KEY=${codificar(rutaPublica)}`);
