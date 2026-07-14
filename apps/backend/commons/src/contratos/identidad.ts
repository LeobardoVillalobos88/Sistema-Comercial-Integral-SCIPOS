/**
 * Contratos relacionados con la identidad del usuario que hace una petición.
 * La identidad viaja entre servicios en el header `x-usuario-id`.
 */

/** Header HTTP con el identificador del usuario activo. */
export const HEADER_USUARIO_ID = "x-usuario-id";

/** Roles funcionales del sistema. */
export type ClaveRol = "ADMINISTRADOR" | "VENDEDOR" | "CAJERO" | "SUPERVISOR";

/** Estados posibles de un usuario. */
export type EstadoUsuario = "ACTIVO" | "INACTIVO";

/** Representación de un usuario para consumo de otros servicios y del frontend. */
export interface UsuarioSesion {
  id: string;
  nombre: string;
  correo: string;
  rol: ClaveRol;
  estado: EstadoUsuario;
}
