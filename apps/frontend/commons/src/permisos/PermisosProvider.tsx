"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { establecerToken, llamarApi } from "../api";
import { CREDENCIALES_DEMO } from "./credenciales-demo";
import { rolTienePrivilegio } from "./matriz";
import type { PermisosContextValue, Privilegio, Rol, UsuarioSesion } from "./tipos";

const ROLES: Rol[] = ["ADMINISTRADOR", "VENDEDOR", "CAJERO", "SUPERVISOR"];

/** Clave de sessionStorage donde se conserva el token de la pestaña. */
const CLAVE_TOKEN = "scipos.token";

const PermisosContext = createContext<PermisosContextValue | null>(null);

interface SesionApi {
  token: string;
  usuario: UsuarioSesion;
  privilegios: string[];
}

interface PerfilApi {
  usuario: UsuarioSesion;
  privilegios: string[];
}

export interface PermisosProviderProps {
  children: React.ReactNode;
  /** Rol con el que inicia la sesión demo. */
  rolInicial?: Rol;
}

/**
 * Proveedor del contexto de permisos. La sesión es real: `iniciarSesion`
 * obtiene un JWT del servicio de seguridad y desde entonces todas las
 * llamadas de `llamarApi` viajan firmadas; el backend valida cada acción
 * (RF-05/RF-06). El selector de rol del topbar inicia sesión con las
 * credenciales demo del rol elegido, y la sesión sobrevive a recargas dentro
 * de la misma pestaña (sessionStorage + GET /auth/perfil).
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

  const aplicarSesion = useCallback((token: string | null, perfil: PerfilApi) => {
    if (token) {
      establecerToken(token);
      window.sessionStorage.setItem(CLAVE_TOKEN, token);
    }
    setUsuario(perfil.usuario);
    setPrivilegios(perfil.privilegios as Privilegio[]);
    setRolEstado(perfil.usuario.rol);
  }, []);

  const limpiarSesion = useCallback(() => {
    establecerToken(null);
    window.sessionStorage.removeItem(CLAVE_TOKEN);
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
      aplicarSesion(sesion.token, sesion);
    },
    [aplicarSesion],
  );

  const cerrarSesion = useCallback(() => {
    limpiarSesion();
  }, [limpiarSesion]);

  /** Cambia de rol iniciando sesión demo con las credenciales de ese rol. */
  const setRol = useCallback(
    (nuevoRol: Rol) => {
      setRolEstado(nuevoRol);
      setCargandoPermisos(true);
      const credenciales = CREDENCIALES_DEMO[nuevoRol];
      iniciarSesion(credenciales.correo, credenciales.contrasena)
        .catch(() => {
          limpiarSesion();
        })
        .finally(() => {
          setCargandoPermisos(false);
        });
    },
    [iniciarSesion, limpiarSesion],
  );

  // Al montar: restaura la sesión guardada en la pestaña o inicia la demo.
  // biome-ignore lint/correctness/useExhaustiveDependencies: el arranque de sesión debe correr una sola vez
  useEffect(() => {
    let vigente = true;
    async function arrancar() {
      const tokenGuardado = window.sessionStorage.getItem(CLAVE_TOKEN);
      if (tokenGuardado) {
        establecerToken(tokenGuardado);
        try {
          const perfil = await llamarApi<PerfilApi>("/seguridad/auth/perfil");
          if (vigente) {
            aplicarSesion(null, perfil);
          }
          return;
        } catch {
          if (vigente) {
            limpiarSesion();
          }
        }
      }
      const credenciales = CREDENCIALES_DEMO[rolInicial];
      try {
        await iniciarSesion(credenciales.correo, credenciales.contrasena);
      } catch {
        if (vigente) {
          limpiarSesion();
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
      setRol,
      roles: ROLES,
      can,
      usuario,
      origenPermisos: privilegios ? "api" : "local",
      cargandoPermisos,
      iniciarSesion,
      cerrarSesion,
    }),
    [rol, setRol, can, usuario, privilegios, cargandoPermisos, iniciarSesion, cerrarSesion],
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
