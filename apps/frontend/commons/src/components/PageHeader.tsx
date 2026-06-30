"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export interface PageHeaderProps {
  titulo: string;
  descripcion?: string;
  /** Acciones a la derecha (por ejemplo, un botón "Nuevo"). */
  acciones?: React.ReactNode;
}

/** Encabezado estándar de página: título + descripción + acciones. */
export function PageHeader({ titulo, descripcion, acciones }: PageHeaderProps) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", sm: "center" }}
      spacing={2}
      sx={{ mb: 3 }}
    >
      <Box>
        <Typography variant="h5" component="h1">
          {titulo}
        </Typography>
        {descripcion ? (
          <Typography variant="body2" color="text.secondary">
            {descripcion}
          </Typography>
        ) : null}
      </Box>
      {acciones ? <Box>{acciones}</Box> : null}
    </Stack>
  );
}
