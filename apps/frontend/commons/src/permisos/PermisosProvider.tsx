"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { rolTienePrivilegio } from "./matriz";
import type { PermisosContextValue, Privilegio, Rol } from "./tipos";

const ROLES: Rol[] = ["ADMINISTRADOR", "VENDEDOR", "CAJERO", "SUPERVISOR"];

const PermisosContext = createContext<PermisosContextValue | null>(null);

export interface PermisosProviderProps {
  children: React.ReactNode;
  /** Rol con el que inicia la sesión. */
  rolInicial?: Rol;
}

/**
 * Proveedor del contexto de permisos. Envuelve la app para que cualquier
 * módulo pueda consultar el rol activo y sus privilegios.
 */
export function PermisosProvider({
  children,
  rolInicial = "ADMINISTRADOR",
}: PermisosProviderProps) {
  const [rol, setRol] = useState<Rol>(rolInicial);

  const can = useCallback((privilegio: Privilegio) => rolTienePrivilegio(rol, privilegio), [rol]);

  const value = useMemo<PermisosContextValue>(
    () => ({ rol, setRol, roles: ROLES, can }),
    [rol, can],
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
