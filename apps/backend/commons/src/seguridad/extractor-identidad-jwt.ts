import { Injectable, UnauthorizedException } from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import { HEADER_USUARIO_ID } from "../contratos/identidad";
import type { ExtractorIdentidad, PeticionConCabeceras } from "./extractor-identidad";

/** Carga útil que firma el servicio de seguridad al iniciar sesión. */
export interface CargaTokenScipos {
  /** Id del usuario autenticado. */
  sub: string;
  correo: string;
  rol: string;
}

/** Secreto de desarrollo si JWT_SECRETO no está definido en el entorno. */
const SECRETO_DEV = "scipos-secreto-dev";

/**
 * Identifica al usuario de una petición con un token JWT
 * (`Authorization: Bearer <token>`). Un token presente pero inválido o
 * expirado rechaza la petición con 401, aunque venga acompañado de otros
 * headers.
 *
 * Si la petición no trae token, cae al header interno `x-usuario-id`: es el
 * canal con el que los servicios se propagan la identidad entre sí. El
 * gateway elimina ese header de todas las peticiones externas, de modo que
 * desde fuera solo se acepta identidad firmada.
 */
@Injectable()
export class ExtractorIdentidadJwt implements ExtractorIdentidad {
  extraer(peticion: PeticionConCabeceras): string | null {
    const autorizacion = peticion.headers.authorization;
    if (typeof autorizacion === "string" && autorizacion.startsWith("Bearer ")) {
      const token = autorizacion.slice("Bearer ".length).trim();
      try {
        const carga = jwt.verify(
          token,
          process.env.JWT_SECRETO ?? SECRETO_DEV,
        ) as unknown as CargaTokenScipos;
        return typeof carga.sub === "string" && carga.sub !== "" ? carga.sub : null;
      } catch {
        throw new UnauthorizedException("El token es inválido o ya expiró.");
      }
    }

    const valor = peticion.headers[HEADER_USUARIO_ID];
    if (typeof valor !== "string" || valor.trim() === "") {
      return null;
    }
    return valor.trim();
  }
}
