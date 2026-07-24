import { Injectable, UnauthorizedException } from "@nestjs/common";
import { HEADER_USUARIO_ID } from "../contratos/identidad";
import type {
  ExtractorIdentidad,
  IdentidadResuelta,
  PeticionConCabeceras,
} from "./extractor-identidad";
import { VerificadorToken } from "./verificador-token";

/**
 * Identifica al usuario de una petición con un token JWT RS256
 * (`Authorization: Bearer <token>`). Un token presente pero inválido, expirado
 * o de otro emisor/audiencia rechaza la petición con 401.
 *
 * Si la petición no trae token, cae al header interno `x-usuario-id`: es el
 * canal con el que los servicios se propagan la identidad entre sí. El gateway
 * elimina ese header de las peticiones externas, de modo que desde fuera solo
 * se acepta identidad firmada.
 */
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
        // Sin jti el token no sería revocable nunca: se rechaza (fail-closed).
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
