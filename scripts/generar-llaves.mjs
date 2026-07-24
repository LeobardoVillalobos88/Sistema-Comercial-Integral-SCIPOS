/**
 * Genera el par de llaves RSA que el servicio de seguridad usa para firmar los
 * tokens de acceso (RS256). La privada firma; la pública se publica en el JWKS
 * para que los demás servicios verifiquen sin poder emitir tokens.
 *
 * Las llaves NO se versionan (están en .gitignore). Cada quien genera las
 * suyas con `pnpm generar:llaves`; el script no las regenera si ya existen.
 */
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
