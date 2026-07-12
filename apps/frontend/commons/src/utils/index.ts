import type { Cotizacion } from "../mocks/tipos";

/** Formatea un número como moneda en pesos mexicanos (es-MX). */
export function formatearMoneda(valor: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(valor);
}

/** Formatea una fecha ISO a formato corto es-MX (dd/mm/aaaa). */
export function formatearFecha(isoFecha: string): string {
  const fecha = new Date(isoFecha);
  if (Number.isNaN(fecha.getTime())) {
    return isoFecha;
  }
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(fecha);
}

/** Formatea una fecha ISO con hora en es-MX (dd mmm aaaa, hh:mm). */
export function formatearFechaConHora(isoFecha: string): string {
  const fecha = new Date(isoFecha);
  if (Number.isNaN(fecha.getTime())) {
    return isoFecha;
  }
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(fecha);
}

/** Total de una cotización: suma de cantidad × precio unitario de sus partidas. */
export function totalCotizacion(cotizacion: Cotizacion): number {
  return cotizacion.partidas.reduce(
    (acc, partida) => acc + partida.cantidad * partida.precioUnitario,
    0,
  );
}
