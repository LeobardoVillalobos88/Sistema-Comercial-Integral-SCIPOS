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

/** Claims que se firman en el token de acceso. */
export interface DatosToken {
  sub: string;
  correo: string;
  rol: string;
  privilegios: string[];
  jti: string;
}

/**
 * Obtiene una llave en formato PEM.
 *
 * Prioriza el contenido en variable de entorno sobre la ruta a un archivo: al
 * desplegar en contenedores el secreto se inyecta como variable y no hay
 * archivo que montar, mientras que en desarrollo siguen sirviendo las llaves
 * que genera `pnpm generar:llaves`.
 *
 * Acepta el PEM tal cual, con los saltos de línea escritos como "\n" (habitual
 * al pasar por un archivo .env) o codificado en base64.
 */
function leerPem(variableContenido: string, variableRuta: string, archivoPorDefecto: string) {
  const contenido = process.env[variableContenido];
  if (contenido && contenido.trim().length > 0) {
    const normalizado = contenido.includes("-----BEGIN")
      ? contenido.replace(/\\n/g, "\n")
      : Buffer.from(contenido, "base64").toString("utf8");
    return normalizado.trim();
  }
  const ruta = resolve(process.env[variableRuta] ?? `../../../../keys/${archivoPorDefecto}`);
  return readFileSync(ruta, "utf8");
}

/**
 * Firma tokens de acceso RS256 con la llave privada y publica la pública en un
 * JWKS. Solo este servicio tiene la privada, así que es el único que puede
 * emitir tokens; los demás verifican con el JWKS sin poder firmar.
 */
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
    // El kid es el thumbprint del JWK (RFC 7638): estable ante cambios de formato del PEM.
    this.kid = await calculateJwkThumbprint(jwk);
    this.jwkPublico = { ...jwk, kid: this.kid, use: "sig", alg: "RS256" };
  }

  /** JWKS con la llave pública, para que los demás servicios verifiquen. */
  obtenerJwks() {
    return { keys: [this.jwkPublico] };
  }

  /** Segundos de vida del access token (para calcular expiraciones). */
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
