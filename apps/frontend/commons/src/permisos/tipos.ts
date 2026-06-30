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

export interface PermisosContextValue {
  /** Rol actualmente seleccionado. */
  rol: Rol;
  /** Cambia el rol activo (lo usa el selector del topbar). */
  setRol: (rol: Rol) => void;
  /** Lista de roles disponibles. */
  roles: Rol[];
  /** ¿El rol actual tiene el privilegio indicado? */
  can: (privilegio: Privilegio) => boolean;
}

/** Etiquetas legibles de cada rol para la UI. */
export const ETIQUETAS_ROL: Record<Rol, string> = {
  ADMINISTRADOR: "Administrador",
  VENDEDOR: "Vendedor",
  CAJERO: "Cajero",
  SUPERVISOR: "Supervisor",
};
