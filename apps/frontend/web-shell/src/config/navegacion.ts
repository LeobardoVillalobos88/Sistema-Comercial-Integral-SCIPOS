import type { Privilegio } from "@scipos/frontend-commons";

export interface ItemNavegacion {
  /** Texto del menú. */
  etiqueta: string;
  /** Ruta dentro del shell. */
  ruta: string;
  /** Nombre del icono de MUI (se resuelve en el Sidebar). */
  icono:
    | "insights"
    | "dashboard"
    | "inventory"
    | "people"
    | "description"
    | "point_of_sale"
    | "shopping_cart"
    | "savings"
    | "assessment"
    | "manage_accounts";
  /** Privilegio necesario para ver el módulo (si aplica). */
  privilegio?: Privilegio;
}

/**
 * Módulos del sistema y su orden en el menú lateral. Los ítems se ocultan
 * según los privilegios del rol activo.
 */
export const NAVEGACION: ItemNavegacion[] = [
  { etiqueta: "Inicio", ruta: "/inicio", icono: "insights" },
  { etiqueta: "Dashboard", ruta: "/dashboard", icono: "dashboard" },
  {
    etiqueta: "Usuarios",
    ruta: "/usuarios",
    icono: "manage_accounts",
    privilegio: "seguridad:ver",
  },
  {
    etiqueta: "Clientes",
    ruta: "/clientes",
    icono: "people",
    privilegio: "clientes:ver",
  },
  {
    etiqueta: "Productos",
    ruta: "/productos",
    icono: "inventory",
    privilegio: "productos:ver",
  },
  {
    etiqueta: "Cotizaciones",
    ruta: "/cotizaciones",
    icono: "description",
    privilegio: "cotizaciones:ver",
  },
  {
    etiqueta: "Caja",
    ruta: "/caja",
    icono: "savings",
    privilegio: "caja:ver",
  },
  {
    etiqueta: "Punto de venta",
    ruta: "/pos",
    icono: "point_of_sale",
    privilegio: "pos:ver",
  },
  {
    etiqueta: "Punto de compra",
    ruta: "/compras",
    icono: "shopping_cart",
    privilegio: "compras:ver",
  },
  {
    etiqueta: "Reportes",
    ruta: "/reportes",
    icono: "assessment",
    privilegio: "reportes:ver",
  },
];
