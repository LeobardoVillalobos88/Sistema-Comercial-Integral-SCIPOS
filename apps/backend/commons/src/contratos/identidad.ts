export const HEADER_USUARIO_ID = "x-usuario-id";

export type ClaveRol = "ADMINISTRADOR" | "VENDEDOR" | "CAJERO" | "SUPERVISOR";

export type EstadoUsuario = "ACTIVO" | "INACTIVO";

export interface UsuarioSesion {
  id: string;
  nombre: string;
  correo: string;
  rol: ClaveRol;
  estado: EstadoUsuario;
}
