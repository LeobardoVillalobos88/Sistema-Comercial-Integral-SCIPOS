import type { Privilegio } from "@scipos/frontend-commons";

export interface ItemNavegacion {
  /** Texto del menú. */
  etiqueta: string;
  /** Ruta dentro del shell. */
  ruta: string;
  /** Nombre del icono de MUI (se resuelve en el Sidebar). */
  icono: "dashboard" | "inventory" | "people" | "description" | "point_of_sale" | "savings";
  /** Privilegio necesario para ver el módulo (si aplica). */
  privilegio?: Privilegio;
  /** Integrante responsable del módulo. */
  responsable: string;
}

/**
 * Módulos del sistema y su orden en el menú lateral. Cada compañero conectará
 * aquí su microfrontend. Los ítems se ocultan según los privilegios del rol
 * activo.
 */
export const NAVEGACION: ItemNavegacion[] = [
  { etiqueta: "Dashboard", ruta: "/dashboard", icono: "dashboard", responsable: "Leobardo" },
  {
    etiqueta: "Productos",
    ruta: "/productos",
    icono: "inventory",
    privilegio: "productos:ver",
    responsable: "José Arias",
  },
  {
    etiqueta: "Clientes",
    ruta: "/clientes",
    icono: "people",
    privilegio: "clientes:ver",
    responsable: "Jassiel Paredes",
  },
  {
    etiqueta: "Cotizaciones",
    ruta: "/cotizaciones",
    icono: "description",
    privilegio: "cotizaciones:ver",
    responsable: "Ángel Aguilar",
  },
  {
    etiqueta: "Punto de venta",
    ruta: "/pos",
    icono: "point_of_sale",
    privilegio: "pos:ver",
    responsable: "Alejandro Torres",
  },
  {
    etiqueta: "Caja",
    ruta: "/caja",
    icono: "savings",
    privilegio: "caja:ver",
    responsable: "Alejandro Torres",
  },
];
