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
    const rutaPrivada = resolve(
      process.env.JWT_PRIVATE_KEY_PATH ?? "../../../../keys/jwt_private.pem",
    );
    const rutaPublica = resolve(
      process.env.JWT_PUBLIC_KEY_PATH ?? "../../../../keys/jwt_public.pem",
    );
    this.llavePrivada = await importPKCS8(readFileSync(rutaPrivada, "utf8"), "RS256");
    const llavePublica = await importSPKI(readFileSync(rutaPublica, "utf8"), "RS256");
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
