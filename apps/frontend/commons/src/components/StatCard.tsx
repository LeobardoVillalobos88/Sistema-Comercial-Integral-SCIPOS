"use client";

import Avatar from "@mui/material/Avatar";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export interface StatCardProps {
  titulo: string;
  valor: string | number;
  /** Texto secundario opcional (por ejemplo, "vs. ayer"). */
  detalle?: string;
  icono?: React.ReactNode;
  color?: "primary" | "secondary" | "success" | "error";
}

/** Tarjeta de métrica para el dashboard. */
export function StatCard({ titulo, valor, detalle, icono, color = "primary" }: StatCardProps) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              {titulo}
            </Typography>
            <Typography variant="h4" component="p">
              {valor}
            </Typography>
            {detalle ? (
              <Typography variant="caption" color="text.secondary">
                {detalle}
              </Typography>
            ) : null}
          </Stack>
          {icono ? (
            <Avatar sx={{ bgcolor: `${color}.main`, width: 48, height: 48 }}>{icono}</Avatar>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
