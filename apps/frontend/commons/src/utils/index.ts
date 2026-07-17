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
