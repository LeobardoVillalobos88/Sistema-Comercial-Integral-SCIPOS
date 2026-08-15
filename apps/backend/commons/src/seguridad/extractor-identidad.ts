export const EXTRACTOR_IDENTIDAD = "EXTRACTOR_IDENTIDAD";

export interface PeticionConCabeceras {
  headers: Record<string, string | string[] | undefined>;
}

export interface IdentidadResuelta {
  usuarioId: string;
  jti?: string;
}

export interface ExtractorIdentidad {
  extraer(peticion: PeticionConCabeceras): Promise<IdentidadResuelta | null>;
}
