"use client";

import Chip from "@mui/material/Chip";

export interface EstadoChipProps {
  activo: boolean;
  etiquetaActivo?: string;
  etiquetaInactivo?: string;
}

export function EstadoChip({
  activo,
  etiquetaActivo = "Activo",
  etiquetaInactivo = "Inactivo",
}: EstadoChipProps) {
  return (
    <Chip
      size="small"
      color={activo ? "success" : "default"}
      variant={activo ? "filled" : "outlined"}
      label={activo ? etiquetaActivo : etiquetaInactivo}
    />
  );
}
