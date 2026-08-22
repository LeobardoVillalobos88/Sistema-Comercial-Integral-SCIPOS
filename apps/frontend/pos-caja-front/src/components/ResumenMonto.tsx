"use client";

import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

export interface ResumenMontoProps {
  etiqueta: string;
  valor: string;
  color?: string;
}

export function ResumenMonto({ etiqueta, valor, color }: ResumenMontoProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {etiqueta}
      </Typography>
      <Typography variant="h6" sx={{ color }}>
        {valor}
      </Typography>
    </Paper>
  );
}
