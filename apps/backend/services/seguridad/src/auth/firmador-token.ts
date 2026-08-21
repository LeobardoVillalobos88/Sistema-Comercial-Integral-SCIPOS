import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Injectable, type OnModuleInit } from "@nestjs/common";
import { audienciaToken, emisorToken } from "@scipos/backend-commons";
import {
  type KeyLike,
  SignJWT,
  calculateJwkThumbprint,
  exportJWK,
  importPKCS8,
  importSPKI,
} from "jose";

export interface DatosToken {
  sub: string;
  correo: string;
  rol: string;
  privilegios: string[];
  jti: string;
}

function leerPem(variableContenido: string, variableRuta: string, archivoPorDefecto: string) {
  const contenido = process.env[variableContenido];
  if (contenido && contenido.trim().length > 0) {
    const normalizado = contenido.includes("-----BEGIN")
      ? contenido.replace(/\\n/g, "\n")
      : Buffer.from(contenido, "base64").toString("utf8");
    if (!normalizado.includes("-----BEGIN")) {
      throw new Error(
        `La variable ${variableContenido} no contiene una llave PEM válida. Genera el par con 'pnpm generar:llaves' y copia el valor que imprime 'pnpm llaves:entorno'.`,
      );
    }
    return normalizado.trim();
  }

  const ruta = resolve(process.env[variableRuta] ?? `../../../../keys/${archivoPorDefecto}`);
  try {
    return readFileSync(ruta, "utf8");
  } catch {
    throw new Error(
      `No se encontró la llave de firma: ni la variable ${variableContenido} ni el archivo ${ruta}. En un despliegue define ${variableContenido}; en local ejecuta 'pnpm generar:llaves'.`,
    );
  }
}

@Injectable()
export class FirmadorToken implements OnModuleInit {
  private llavePrivada!: KeyLike;
  private kid!: string;
  private jwkPublico!: Record<string, unknown>;
  private readonly ttlAccesoSeg = Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 900);

  async onModuleInit() {
    const pemPrivado = leerPem("JWT_PRIVATE_KEY", "JWT_PRIVATE_KEY_PATH", "jwt_private.pem");
    const pemPublico = leerPem("JWT_PUBLIC_KEY", "JWT_PUBLIC_KEY_PATH", "jwt_public.pem");
    this.llavePrivada = await importPKCS8(pemPrivado, "RS256");
    const llavePublica = await importSPKI(pemPublico, "RS256");
    const jwk = await exportJWK(llavePublica);
    this.kid = await calculateJwkThumbprint(jwk);
    this.jwkPublico = { ...jwk, kid: this.kid, use: "sig", alg: "RS256" };
  }

  obtenerJwks() {
    return { keys: [this.jwkPublico] };
  }

  get ttlAcceso(): number {
    return this.ttlAccesoSeg;
  }

  async firmarAcceso(datos: DatosToken): Promise<{ token: string; expiraEn: Date }> {
    const expiraEn = new Date(Date.now() + this.ttlAccesoSeg * 1000);
    const token = await new SignJWT({
      correo: datos.correo,
      rol: datos.rol,
      privilegios: datos.privilegios,
    })
      .setProtectedHeader({ alg: "RS256", kid: this.kid })
      .setSubject(datos.sub)
      .setIssuer(emisorToken())
      .setAudience(audienciaToken())
      .setIssuedAt()
      .setExpirationTime(`${this.ttlAccesoSeg}s`)
      .setJti(datos.jti)
      .sign(this.llavePrivada);
    return { token, expiraEn };
  }
}
