export function formatearMoneda(valor: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(valor);
}

export function formatearFecha(isoFecha: string): string {
  const fecha = new Date(isoFecha);
  if (Number.isNaN(fecha.getTime())) {
    return isoFecha;
  }
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(fecha);
}

export function formatearFechaCalendario(isoFecha: string): string {
  const fecha = new Date(isoFecha);
  if (Number.isNaN(fecha.getTime())) {
    return isoFecha;
  }
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "UTC" }).format(fecha);
}

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
