export {
  estaMarcadoEnSesion,
  limpiarEstadoDeSesion,
  marcarEnSesion,
} from "./estadoDeSesion";
export { MATRIZ_PRIVILEGIOS, rolTienePrivilegio } from "./matriz";
export { PermisosProvider, usePermisos } from "./PermisosProvider";
export type { PermisosProviderProps } from "./PermisosProvider";
export { ETIQUETAS_ROL } from "./tipos";
export type { PermisosContextValue, Privilegio, Rol, UsuarioSesion } from "./tipos";
