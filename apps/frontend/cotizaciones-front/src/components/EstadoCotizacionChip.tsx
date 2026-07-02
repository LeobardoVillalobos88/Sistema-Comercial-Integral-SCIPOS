"use client";

import Chip from "@mui/material/Chip";
import type { EstadoCotizacion } from "@scipos/frontend-commons";

const CONFIG: Record<
  EstadoCotizacion,
  { etiqueta: string; color: "default" | "info" | "success" }
> = {
  BORRADOR: { etiqueta: "Borrador", color: "default" },
  ENVIADA: { etiqueta: "Enviada", color: "info" },
  CONVERTIDA: { etiqueta: "Convertida", color: "success" },
};

/** Chip de estado propio de cotizaciones (Borrador/Enviada/Convertida). */
export function EstadoCotizacionChip({ estado }: { estado: EstadoCotizacion }) {
  const { etiqueta, color } = CONFIG[estado];
  return <Chip size="small" color={color} label={etiqueta} />;
}
