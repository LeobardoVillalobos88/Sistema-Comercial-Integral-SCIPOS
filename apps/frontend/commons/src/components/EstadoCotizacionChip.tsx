"use client";

import Chip from "@mui/material/Chip";
import type { EstadoCotizacion } from "../mocks/tipos";

const CHIP_POR_ESTADO: Record<
  EstadoCotizacion,
  { etiqueta: string; color: "default" | "info" | "success" }
> = {
  BORRADOR: { etiqueta: "Borrador", color: "default" },
  ENVIADA: { etiqueta: "Enviada", color: "info" },
  VENDIDA: { etiqueta: "Vendida", color: "success" },
};

export interface EstadoCotizacionChipProps {
  estado: EstadoCotizacion;
}

export function EstadoCotizacionChip({ estado }: EstadoCotizacionChipProps) {
  const chip = CHIP_POR_ESTADO[estado];
  return <Chip size="small" color={chip.color} label={chip.etiqueta} />;
}
