"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ESMALTE, PLANO } from "../theme";

export interface PageHeaderProps {
  titulo: string;
  descripcion?: string;
  /** Acciones a la derecha (por ejemplo, un botón "Nuevo"). */
  acciones?: React.ReactNode;
}

/**
 * Encabezado de módulo. Es el rótulo de la pantalla: va a escala display con
 * sombra desplazada y cierra con una banda de pintura, de modo que quien entra
 * sepa dónde está desde el otro lado del salón.
 */
export function PageHeader({ titulo, descripcion, acciones }: PageHeaderProps) {
  return (
    <Box sx={{ mb: 3, pb: 2, borderBottom: `4px solid ${ESMALTE.azul}` }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "flex-end" }}
        spacing={2}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="h1"
            sx={{
              fontWeight: 900,
              fontSize: { xs: "2.125rem", sm: "2.75rem", md: "3.25rem" },
              lineHeight: 0.9,
              letterSpacing: "-0.035em",
              color: ESMALTE.azul,
              textShadow: `4px 4px 0 ${ESMALTE.azul}22`,
            }}
          >
            {titulo}
          </Typography>
          {descripcion ? (
            <Typography
              variant="overline"
              sx={{
                display: "block",
                mt: 1.25,
                fontSize: 10.5,
                letterSpacing: "0.16em",
                color: PLANO.tintaSuave,
              }}
            >
              {descripcion}
            </Typography>
          ) : null}
        </Box>
        {acciones ? <Box sx={{ flexShrink: 0 }}>{acciones}</Box> : null}
      </Stack>
    </Box>
  );
}
