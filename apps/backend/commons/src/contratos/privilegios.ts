/**
 * Contratos del sistema de privilegios dinámicos. Un privilegio tiene el
 * formato `modulo:accion`, por ejemplo "productos:crear" o "caja:cerrar".
 */

/** Token de inyección del proveedor de privilegios. */
export const PROVEEDOR_PRIVILEGIOS = "PROVEEDOR_PRIVILEGIOS";

/** Motivo por el que se niega una verificación de privilegio. */
export type MotivoRechazo = "USUARIO_NO_ENCONTRADO" | "USUARIO_INACTIVO" | "SIN_PRIVILEGIO";

/** Resultado de verificar si un usuario cuenta con un privilegio. */
export interface ResultadoVerificacion {
  tiene: boolean;
  motivo?: MotivoRechazo;
}

/**
 * Abstracción de la fuente de verdad de privilegios. El guard depende de esta
 * interfaz; cada servicio decide la implementación (consulta HTTP al servicio
 * de seguridad, o consulta local cuando el servicio ES el de seguridad).
 */
export interface ProveedorPrivilegios {
  verificar(usuarioId: string, privilegio: string): Promise<ResultadoVerificacion>;
}

/** Privilegios efectivos de un usuario (respuesta del servicio de seguridad). */
export interface PrivilegiosDeUsuario {
  usuarioId: string;
  rol: string;
  privilegios: string[];
}
