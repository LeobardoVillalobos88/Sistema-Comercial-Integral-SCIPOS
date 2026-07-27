"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  establecerRefreshToken,
  establecerToken,
  llamarApi,
  registrarRenovacionTokens,
} from "../api";
import { rolTienePrivilegio } from "./matriz";
import type { PermisosContextValue, Privilegio, Rol, UsuarioSesion } from "./tipos";

const ROLES: Rol[] = ["ADMINISTRADOR", "VENDEDOR", "CAJERO", "SUPERVISOR"];

/** Claves de sessionStorage donde se conservan los tokens de la pestaña. */
const CLAVE_TOKEN = "scipos.token";
const CLAVE_REFRESH = "scipos.refresh";

const PermisosContext = createContext<PermisosContextValue | null>(null);

interface SesionApi {
  token: string;
  refreshToken: string;
  usuario: UsuarioSesion;
  privilegios: string[];
}

interface PerfilApi {
  usuario: UsuarioSesion;
  privilegios: string[];
}

/** Guarda o limpia el par de tokens en el cliente HTTP y en sessionStorage. */
function persistirTokens(token: string | null, refreshToken: string | null): void {
  establecerToken(token);
  establecerRefreshToken(refreshToken);
  if (token) {
    window.sessionStorage.setItem(CLAVE_TOKEN, token);
  } else {
    window.sessionStorage.removeItem(CLAVE_TOKEN);
  }
  if (refreshToken) {
    window.sessionStorage.setItem(CLAVE_REFRESH, refreshToken);
  } else {
    window.sessionStorage.removeItem(CLAVE_REFRESH);
  }
}

export interface PermisosProviderProps {
  children: React.ReactNode;
  /** Rol con el que inicia la sesión demo. */
  rolInicial?: Rol;
}

/**
 * Proveedor del contexto de permisos. La sesión es real: `iniciarSesion`
 * obtiene un access token RS256 y un refresh token del servicio de seguridad;
 * desde entonces todas las llamadas de `llamarApi` viajan firmadas y el backend
 * valida cada acción (RF-05/RF-06). El access se renueva solo con el refresh
 * cuando expira. `iniciarSesion` es lo que consume la pantalla de login; la
 * sesión sobrevive a recargas dentro de la misma pestaña (sessionStorage +
 * GET /auth/perfil).
 *
 * Si la API no está disponible, los privilegios se resuelven con la matriz
 * local de respaldo para que la interfaz siga siendo navegable; las
 * operaciones protegidas seguirán fallando porque el backend es quien valida.
 */
export function PermisosProvider({
  children,
  rolInicial = "ADMINISTRADOR",
}: PermisosProviderProps) {
  const [rol, setRolEstado] = useState<Rol>(rolInicial);
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [privilegios, setPrivilegios] = useState<Privilegio[] | null>(null);
  const [cargandoPermisos, setCargandoPermisos] = useState(true);

  const aplicarPerfil = useCallback((perfil: PerfilApi) => {
    setUsuario(perfil.usuario);
    setPrivilegios(perfil.privilegios as Privilegio[]);
    setRolEstado(perfil.usuario.rol);
  }, []);

  const limpiarSesion = useCallback(() => {
    persistirTokens(null, null);
    setUsuario(null);
    setPrivilegios(null);
  }, []);

  /** Inicia sesión real contra la API; lanza ErrorApi si las credenciales fallan. */
  const iniciarSesion = useCallback(
    async (correo: string, contrasena: string) => {
      const sesion = await llamarApi<SesionApi>("/seguridad/auth/login", {
        method: "POST",
        body: JSON.stringify({ correo, contrasena }),
      });
      persistirTokens(sesion.token, sesion.refreshToken);
      aplicarPerfil(sesion);
    },
    [aplicarPerfil],
  );

  const cerrarSesion = useCallback(() => {
    // Revoca el token en el backend (best-effort) y limpia la sesión local.
    llamarApi("/seguridad/auth/logout", { method: "POST" }).catch(() => undefined);
    limpiarSesion();
  }, [limpiarSesion]);

  // Al montar: persiste los tokens que el cliente renueve solo y restaura la
  // sesión guardada en la pestaña.
  // biome-ignore lint/correctness/useExhaustiveDependencies: el arranque de sesión debe correr una sola vez
  useEffect(() => {
    let vigente = true;
    registrarRenovacionTokens(({ token, refreshToken }) => {
      window.sessionStorage.setItem(CLAVE_TOKEN, token);
      window.sessionStorage.setItem(CLAVE_REFRESH, refreshToken);
    });

    async function arrancar() {
      const tokenGuardado = window.sessionStorage.getItem(CLAVE_TOKEN);
      const refreshGuardado = window.sessionStorage.getItem(CLAVE_REFRESH);
      if (tokenGuardado && refreshGuardado) {
        establecerToken(tokenGuardado);
        establecerRefreshToken(refreshGuardado);
        try {
          // Si el access expiró, llamarApi lo renueva solo con el refresh.
          const perfil = await llamarApi<PerfilApi>("/seguridad/auth/perfil");
          if (vigente) {
            aplicarPerfil(perfil);
          }
          return;
        } catch {
          if (vigente) {
            limpiarSesion();
          }
        }
      }
      // Ya no iniciamos sesión demo automáticamente, requerimos login explícito
    }
    arrancar().finally(() => {
      if (vigente) {
        setCargandoPermisos(false);
      }
    });
    return () => {
      vigente = false;
      registrarRenovacionTokens(null);
    };
  }, []);

  const can = useCallback(
    (privilegio: Privilegio) =>
      privilegios ? privilegios.includes(privilegio) : rolTienePrivilegio(rol, privilegio),
    [privilegios, rol],
  );

  const value = useMemo<PermisosContextValue>(
    () => ({
      rol,
      roles: ROLES,
      can,
      usuario,
      origenPermisos: privilegios ? "api" : "local",
      cargandoPermisos,
      iniciarSesion,
      cerrarSesion,
    }),
    [rol, can, usuario, privilegios, cargandoPermisos, iniciarSesion, cerrarSesion],
  );

  return <PermisosContext.Provider value={value}>{children}</PermisosContext.Provider>;
}

/**
 * Hook para consumir los permisos en cualquier componente.
 * Ejemplo:
 *   const { can } = usePermisos();
 *   {can("productos:crear") && <Button>Nuevo</Button>}
 */
export function usePermisos(): PermisosContextValue {
  const ctx = useContext(PermisosContext);
  if (!ctx) {
    throw new Error("usePermisos debe usarse dentro de <PermisosProvider>.");
  }
  return ctx;
}
