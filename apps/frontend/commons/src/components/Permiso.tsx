"use client";

import { usePermisos } from "../permisos";
import type { Privilegio } from "../permisos";

export interface PermisoProps {
  /** Privilegio requerido para mostrar el contenido. */
  requiere: Privilegio;
  children: React.ReactNode;
  /** Qué renderizar si NO tiene el privilegio (por defecto, nada). */
  fallback?: React.ReactNode;
}

/**
 * Oculta su contenido si el rol activo no tiene el privilegio requerido.
 * Útil para botones y secciones sensibles.
 *
 * Ejemplo:
 *   <Permiso requiere="pos:descuento">
 *     <Button>Aplicar descuento</Button>
 *   </Permiso>
 */
export function Permiso({ requiere, children, fallback = null }: PermisoProps) {
  const { can } = usePermisos();
  return <>{can(requiere) ? children : fallback}</>;
}
