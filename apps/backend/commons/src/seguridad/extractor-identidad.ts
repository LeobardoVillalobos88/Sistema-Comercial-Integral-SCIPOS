/** Token de inyección del extractor de identidad. */
export const EXTRACTOR_IDENTIDAD = "EXTRACTOR_IDENTIDAD";

/** Forma mínima de la petición que necesita el extractor. */
export interface PeticionConCabeceras {
  headers: Record<string, string | string[] | undefined>;
}

/** Identidad resuelta de una petición. */
export interface IdentidadResuelta {
  /** Id del usuario autenticado. */
  usuarioId: string;
  /** Id del token (claim `jti`), presente solo cuando la identidad viene de un JWT. */
  jti?: string;
}

/**
 * Abstracción del mecanismo con el que se identifica al usuario de una
 * petición. El guard de privilegios depende de esta interfaz, por lo que
 * cambiar la estrategia de identidad (secreto compartido, RS256/JWKS, etc.)
 * no requiere tocar guards ni controladores.
 */
export interface ExtractorIdentidad {
  extraer(peticion: PeticionConCabeceras): Promise<IdentidadResuelta | null>;
}
