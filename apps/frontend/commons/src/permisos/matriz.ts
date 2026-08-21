import type { Privilegio, Rol } from "./tipos";

export const MATRIZ_PRIVILEGIOS: Record<Rol, Privilegio[] | "*"> = {
  ADMINISTRADOR: "*",

  VENDEDOR: [
    "productos:ver",
    "clientes:ver",
    "clientes:crear",
    "clientes:editar",
    "cotizaciones:ver",
    "cotizaciones:crear",
    "cotizaciones:enviar",
    "cotizaciones:convertir",
    "pos:ver",
    "pos:vender",
    "ventas:comprobante",
  ],

  CAJERO: [
    "productos:ver",
    "clientes:ver",
    "pos:ver",
    "pos:vender",
    "ventas:comprobante",
    "caja:ver",
    "caja:abrir",
    "caja:movimiento",
    "caja:cerrar",
  ],

  SUPERVISOR: [
    "productos:ver",
    "productos:crear",
    "productos:editar",
    "productos:desactivar",
    "clientes:ver",
    "cotizaciones:ver",
    "pos:ver",
    "pos:descuento",
    "pos:cancelar",
    "ventas:comprobante",
    "compras:ver",
    "caja:ver",
    "caja:cerrar",
    "reportes:ver",
    "reportes:utilidad",
    "reportes:exportar",
  ],
};

export function rolTienePrivilegio(rol: Rol, privilegio: Privilegio): boolean {
  const permisos = MATRIZ_PRIVILEGIOS[rol];
  if (permisos === "*") {
    return true;
  }
  return permisos.includes(privilegio);
}
