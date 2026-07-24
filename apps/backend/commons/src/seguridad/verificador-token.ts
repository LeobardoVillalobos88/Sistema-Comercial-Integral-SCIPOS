import { Injectable } from "@nestjs/common";
import { type JWTVerifyResult, createRemoteJWKSet, jwtVerify } from "jose";
import { audienciaToken, emisorToken, urlJwks } from "../contratos/tokens";

/**
 * Verifica tokens de acceso RS256 contra el JWKS del servicio de seguridad.
 * jose cachea las llaves públicas, así que no se descarga el JWKS en cada
 * petición. Verificar `iss`/`aud` cierra la puerta a tokens firmados con esta
 * misma llave pero destinados a otro emisor o audiencia.
 */
@Injectable()
export class VerificadorToken {
  private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

  private obtenerJwks() {
    if (!this.jwks) {
      this.jwks = createRemoteJWKSet(new URL(urlJwks()));
    }
    return this.jwks;
  }

  /** Verifica la firma y los claims estándar; lanza si el token no es válido. */
  verificar(token: string): Promise<JWTVerifyResult> {
    return jwtVerify(token, this.obtenerJwks(), {
      algorithms: ["RS256"],
      issuer: emisorToken(),
      audience: audienciaToken(),
    });
  }
}
