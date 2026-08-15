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
  rolInicial?: Rol;
}

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
    llamarApi("/seguridad/auth/logout", { method: "POST" }).catch(() => undefined);
    limpiarSesion();
  }, [limpiarSesion]);

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

export function usePermisos(): PermisosContextValue {
  const ctx = useContext(PermisosContext);
  if (!ctx) {
    throw new Error("usePermisos debe usarse dentro de <PermisosProvider>.");
  }
  return ctx;
}
