/**
 * Tipos del sistema de permisos. Los privilegios controlan qué acciones puede
 * ver y ejecutar cada rol en cada módulo (RF-04/RF-05).
 */

/** Roles del sistema (RF-03). */
export type Rol = "ADMINISTRADOR" | "VENDEDOR" | "CAJERO" | "SUPERVISOR";

/**
 * Privilegio con formato `modulo:accion`.
 * Ejemplos: "productos:crear", "pos:descuento", "caja:cerrar".
 */
export type Privilegio = `${string}:${string}`;

/** Usuario del sistema tal como lo entrega el servicio de seguridad. */
export interface UsuarioSesion {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  estado: "ACTIVO" | "INACTIVO";
}

export interface PermisosContextValue {
  /** Rol actualmente seleccionado. */
  rol: Rol;
  /** Cambia el rol activo iniciando sesión demo con ese rol (selector del topbar). */
  setRol: (rol: Rol) => void;
  /** Lista de roles disponibles. */
  roles: Rol[];
  /** ¿El usuario activo tiene el privilegio indicado? */
  can: (privilegio: Privilegio) => boolean;
  /** Usuario con sesión iniciada (null si no hay sesión o la API no responde). */
  usuario: UsuarioSesion | null;
  /** Origen de los privilegios: "api" (backend) o "local" (matriz de respaldo). */
  origenPermisos: "api" | "local";
  /** true mientras se inicia o restaura la sesión. */
  cargandoPermisos: boolean;
  /** Inicia sesión contra la API con correo y contraseña (lo consume la pantalla de login). */
  iniciarSesion: (correo: string, contrasena: string) => Promise<void>;
  /** Cierra la sesión activa y descarta el token. */
  cerrarSesion: () => void;
}

/** Etiquetas legibles de cada rol para la UI. */
export const ETIQUETAS_ROL: Record<Rol, string> = {
  ADMINISTRADOR: "Administrador",
  VENDEDOR: "Vendedor",
  CAJERO: "Cajero",
  SUPERVISOR: "Supervisor",
};
