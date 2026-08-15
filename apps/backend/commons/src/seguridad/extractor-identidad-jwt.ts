import { Injectable, UnauthorizedException } from "@nestjs/common";
import { HEADER_USUARIO_ID } from "../contratos/identidad";
import type {
  ExtractorIdentidad,
  IdentidadResuelta,
  PeticionConCabeceras,
} from "./extractor-identidad";
import { VerificadorToken } from "./verificador-token";

@Injectable()
export class ExtractorIdentidadJwt implements ExtractorIdentidad {
  constructor(private readonly verificador: VerificadorToken) {}

  async extraer(peticion: PeticionConCabeceras): Promise<IdentidadResuelta | null> {
    const autorizacion = peticion.headers.authorization;
    if (typeof autorizacion === "string" && autorizacion.startsWith("Bearer ")) {
      const token = autorizacion.slice("Bearer ".length).trim();
      let sub: unknown;
      let jti: unknown;
      try {
        const { payload } = await this.verificador.verificar(token);
        sub = payload.sub;
        jti = payload.jti;
      } catch {
        throw new UnauthorizedException("El token es inválido o ya expiró.");
      }
      if (typeof sub !== "string" || sub === "") {
        throw new UnauthorizedException("El token no identifica a un usuario.");
      }
      if (typeof jti !== "string" || jti === "") {
        throw new UnauthorizedException("El token no es revocable (falta jti).");
      }
      return { usuarioId: sub, jti };
    }

    const valor = peticion.headers[HEADER_USUARIO_ID];
    if (typeof valor !== "string" || valor.trim() === "") {
      return null;
    }
    return { usuarioId: valor.trim() };
  }
}
