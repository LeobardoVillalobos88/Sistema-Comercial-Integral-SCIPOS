import type { Privilegio, Rol } from "./tipos";

/**
 * Matriz de privilegios por rol. El comodín "*" significa "todos los
 * privilegios". Cada equipo puede agregar los privilegios que use su módulo
 * con el formato `modulo:accion`.
 */
export const MATRIZ_PRIVILEGIOS: Record<Rol, Privilegio[] | "*"> = {
  // El administrador puede todo.
  ADMINISTRADOR: "*",

  // El vendedor gestiona catálogo (lectura), clientes, cotizaciones y vende.
  VENDEDOR: [
    "productos:ver",
    "clientes:ver",
    "clientes:crear",
    "clientes:editar",
    "cotizaciones:ver",
    "cotizaciones:crear",
    "cotizaciones:convertir",
    "pos:ver",
    "pos:vender",
  ],

  // El cajero opera el punto de venta y la caja.
  CAJERO: [
    "productos:ver",
    "clientes:ver",
    "pos:ver",
    "pos:vender",
    "caja:ver",
    "caja:abrir",
    "caja:movimiento",
    "caja:cerrar",
  ],

  // El supervisor ve todo y autoriza acciones sensibles (descuentos, cancelaciones).
  SUPERVISOR: [
    "productos:ver",
    "productos:crear",
    "productos:editar",
    "clientes:ver",
    "cotizaciones:ver",
    "pos:ver",
    "pos:descuento",
    "pos:cancelar",
    "caja:ver",
    "caja:cerrar",
    "reportes:ver",
  ],
};

/** Evalúa si un rol tiene un privilegio según la matriz. */
export function rolTienePrivilegio(rol: Rol, privilegio: Privilegio): boolean {
  const permisos = MATRIZ_PRIVILEGIOS[rol];
  if (permisos === "*") {
    return true;
  }
  return permisos.includes(privilegio);
}
