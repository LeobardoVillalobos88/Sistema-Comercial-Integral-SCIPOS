import { Injectable } from "@nestjs/common";
import { type JWTVerifyResult, createRemoteJWKSet, jwtVerify } from "jose";
import { audienciaToken, emisorToken, urlJwks } from "../contratos/tokens";

@Injectable()
export class VerificadorToken {
  private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

  private obtenerJwks() {
    if (!this.jwks) {
      this.jwks = createRemoteJWKSet(new URL(urlJwks()));
    }
    return this.jwks;
  }

  verificar(token: string): Promise<JWTVerifyResult> {
    return jwtVerify(token, this.obtenerJwks(), {
      algorithms: ["RS256"],
      issuer: emisorToken(),
      audience: audienciaToken(),
    });
  }
}
