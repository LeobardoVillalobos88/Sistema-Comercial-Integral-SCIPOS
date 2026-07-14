import { Injectable } from "@nestjs/common";
import { HEADER_USUARIO_ID } from "../contratos/identidad";

/** Token de inyección del extractor de identidad. */
export const EXTRACTOR_IDENTIDAD = "EXTRACTOR_IDENTIDAD";

/** Forma mínima de la petición que necesita el extractor. */
export interface PeticionConCabeceras {
  headers: Record<string, string | string[] | undefined>;
}

/**
 * Abstracción del mecanismo con el que se identifica al usuario de una
 * petición. El guard de privilegios depende de esta interfaz, por lo que
 * cambiar la estrategia de identidad no requiere tocar guards ni controladores.
 */
export interface ExtractorIdentidad {
  extraer(peticion: PeticionConCabeceras): string | null;
}

/** Obtiene la identidad del usuario desde el header `x-usuario-id`. */
@Injectable()
export class ExtractorIdentidadHeader implements ExtractorIdentidad {
  extraer(peticion: PeticionConCabeceras): string | null {
    const valor = peticion.headers[HEADER_USUARIO_ID];
    if (typeof valor !== "string" || valor.trim() === "") {
      return null;
    }
    return valor.trim();
  }
}
