"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import type { ReactNode } from "react";

export interface PanelSeccionProps {
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
  children: ReactNode;
}

export function PanelSeccion({ titulo, descripcion, acciones, children }: PanelSeccionProps) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardHeader title={titulo} subheader={descripcion} action={acciones} sx={{ pb: 0 }} />
      <CardContent sx={{ pt: 2 }}>{children}</CardContent>
    </Card>
  );
}
