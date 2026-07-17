"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { establecerUsuarioActivoId, llamarApi } from "../api";
import { rolTienePrivilegio } from "./matriz";
import type { PermisosContextValue, Privilegio, Rol, UsuarioSesion } from "./tipos";

const ROLES: Rol[] = ["ADMINISTRADOR", "VENDEDOR", "CAJERO", "SUPERVISOR"];

const PermisosContext = createContext<PermisosContextValue | null>(null);

interface PrivilegiosDeUsuario {
  usuarioId: string;
  rol: string;
  privilegios: string[];
}

export interface PermisosProviderProps {
  children: React.ReactNode;
  /** Rol con el que inicia la sesión. */
  rolInicial?: Rol;
}

/**
 * Proveedor del contexto de permisos. Descarga del servicio de seguridad los
 * usuarios y los privilegios efectivos del usuario activo: el backend es la
 * fuente de verdad (RF-05/RF-06). El selector del topbar cambia de rol y, con
 * él, de usuario semilla activo.
 *
 * Si la API no está disponible, los privilegios se resuelven con la matriz
 * local de respaldo para que la interfaz siga siendo navegable; las
 * operaciones protegidas seguirán fallando porque el backend es quien valida.
 */
export function PermisosProvider({
  children,
  rolInicial = "ADMINISTRADOR",
}: PermisosProviderProps) {
  const [rol, setRol] = useState<Rol>(rolInicial);
  const [usuarios, setUsuarios] = useState<UsuarioSesion[]>([]);
  const [privilegios, setPrivilegios] = useState<Privilegio[] | null>(null);
  const [cargandoPermisos, setCargandoPermisos] = useState(true);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true);

  // Carga la lista de usuarios una sola vez al montar.
  useEffect(() => {
    let vigente = true;
    llamarApi<UsuarioSesion[]>("/seguridad/usuarios")
      .then((lista) => {
        if (vigente) {
          setUsuarios(lista.filter((usuario) => usuario.estado === "ACTIVO"));
        }
      })
      .catch(() => {
        if (vigente) {
          setUsuarios([]);
        }
      })
      .finally(() => {
        if (vigente) {
          setCargandoUsuarios(false);
        }
      });
    return () => {
      vigente = false;
    };
  }, []);

  const usuario = useMemo(
    () => usuarios.find((candidato) => candidato.rol === rol) ?? null,
    [usuarios, rol],
  );

  // Al cambiar el usuario activo, descarga sus privilegios efectivos.
  useEffect(() => {
    establecerUsuarioActivoId(usuario?.id ?? null);
    if (!usuario) {
      setPrivilegios(null);
      if (!cargandoUsuarios) {
        setCargandoPermisos(false);
      }
      return;
    }
    let vigente = true;
    setCargandoPermisos(true);
    llamarApi<PrivilegiosDeUsuario>(`/seguridad/usuarios/${usuario.id}/privilegios`)
      .then((respuesta) => {
        if (vigente) {
          setPrivilegios(respuesta.privilegios as Privilegio[]);
        }
      })
      .catch(() => {
        if (vigente) {
          setPrivilegios(null);
        }
      })
      .finally(() => {
        if (vigente) {
          setCargandoPermisos(false);
        }
      });
    return () => {
      vigente = false;
    };
  }, [usuario, cargandoUsuarios]);

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
    }),
    [rol, can, usuario, privilegios, cargandoPermisos],
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
