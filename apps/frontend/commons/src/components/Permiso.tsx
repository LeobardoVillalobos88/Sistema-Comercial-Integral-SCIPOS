"use client";

import { usePermisos } from "../permisos";
import type { Privilegio } from "../permisos";

export interface PermisoProps {
  requiere: Privilegio;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Permiso({ requiere, children, fallback = null }: PermisoProps) {
  const { can } = usePermisos();
  return <>{can(requiere) ? children : fallback}</>;
}
