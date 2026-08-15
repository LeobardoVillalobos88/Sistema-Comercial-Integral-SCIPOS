export const PROVEEDOR_PRIVILEGIOS = "PROVEEDOR_PRIVILEGIOS";

export type MotivoRechazo = "USUARIO_NO_ENCONTRADO" | "USUARIO_INACTIVO" | "SIN_PRIVILEGIO";

export interface ResultadoVerificacion {
  tiene: boolean;
  motivo?: MotivoRechazo;
}

export interface ProveedorPrivilegios {
  verificar(usuarioId: string, privilegio: string): Promise<ResultadoVerificacion>;
}

export interface PrivilegiosDeUsuario {
  usuarioId: string;
  rol: string;
  privilegios: string[];
}
