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

/**
 * Formatea una fecha de calendario —una que nombra un día, no un instante—
 * como la caducidad de un lote.
 *
 * Va aparte de `formatearFecha` porque estas fechas se guardan a medianoche
 * UTC, y al pintarlas en la zona horaria de México (UTC−6) medianoche cae seis
 * horas antes, o sea a las 18:00 del **día anterior**: un lote capturado el 30
 * de noviembre se leía como 29 de noviembre. Fijar la zona a UTC devuelve el
 * día que se capturó, que es el único que significa algo aquí.
 *
 * Para marcas de tiempo reales (cuándo se creó una cotización, cuándo se cobró
 * una venta) sigue siendo correcto `formatearFecha`, que las muestra en la hora
 * local de quien mira.
 */
export function formatearFechaCalendario(isoFecha: string): string {
  const fecha = new Date(isoFecha);
  if (Number.isNaN(fecha.getTime())) {
    return isoFecha;
  }
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "UTC" }).format(fecha);
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
