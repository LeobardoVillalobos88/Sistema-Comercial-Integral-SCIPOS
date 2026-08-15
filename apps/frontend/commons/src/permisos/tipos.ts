export type Rol = "ADMINISTRADOR" | "VENDEDOR" | "CAJERO" | "SUPERVISOR";

export type Privilegio = `${string}:${string}`;

export interface UsuarioSesion {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  estado: "ACTIVO" | "INACTIVO";
}

export interface PermisosContextValue {
  rol: Rol;
  roles: Rol[];
  can: (privilegio: Privilegio) => boolean;
  usuario: UsuarioSesion | null;
  origenPermisos: "api" | "local";
  cargandoPermisos: boolean;
  iniciarSesion: (correo: string, contrasena: string) => Promise<void>;
  cerrarSesion: () => void;
}

export const ETIQUETAS_ROL: Record<Rol, string> = {
  ADMINISTRADOR: "Administrador",
  VENDEDOR: "Vendedor",
  CAJERO: "Cajero",
  SUPERVISOR: "Supervisor",
};
