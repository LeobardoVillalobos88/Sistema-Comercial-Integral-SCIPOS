import { generateKeyPairSync } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raizProyecto = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dirLlaves = resolve(raizProyecto, "keys");
const rutaPrivada = resolve(dirLlaves, "jwt_private.pem");
const rutaPublica = resolve(dirLlaves, "jwt_public.pem");

if (existsSync(rutaPrivada) && existsSync(rutaPublica)) {
  console.log("Las llaves RSA ya existen en keys/; no se regeneran.");
  process.exit(0);
}

mkdirSync(dirLlaves, { recursive: true });
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

writeFileSync(rutaPrivada, privateKey, { mode: 0o600 });
writeFileSync(rutaPublica, publicKey);
console.log("Llaves RSA generadas en keys/ (jwt_private.pem, jwt_public.pem).");
