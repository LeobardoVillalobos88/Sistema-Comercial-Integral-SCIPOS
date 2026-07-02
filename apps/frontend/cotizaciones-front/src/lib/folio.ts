import type { Cotizacion } from "@scipos/frontend-commons";

/** Genera el siguiente folio consecutivo del año en curso: COT-AAAA-0001. */
export function generarFolio(cotizaciones: Cotizacion[]): string {
  const anio = new Date().getFullYear();
  const prefijo = `COT-${anio}-`;
  const consecutivos = cotizaciones
    .map((c) => c.folio)
    .filter((folio) => folio.startsWith(prefijo))
    .map((folio) => Number(folio.slice(prefijo.length)))
    .filter((numero) => !Number.isNaN(numero));
  const siguiente = (consecutivos.length > 0 ? Math.max(...consecutivos) : 0) + 1;
  return `${prefijo}${String(siguiente).padStart(4, "0")}`;
}
