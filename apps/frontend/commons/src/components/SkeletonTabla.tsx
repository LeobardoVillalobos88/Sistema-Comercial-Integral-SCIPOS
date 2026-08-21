"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

export interface SkeletonTablaProps {
  /** Número de columnas del esqueleto. */
  columnas?: number;
  /** Número de filas del esqueleto. */
  filas?: number;
  /** Muestra un esqueleto de barra de búsqueda arriba. */
  conBusqueda?: boolean;
}

/**
 * Esqueleto de carga para tablas (mismo aspecto que SearchableTable).
 *
 * Aquí la posición sí sirve como clave, al revés que en SearchableTable: estas
 * celdas no representan ningún dato, no se reordenan ni se filtran, y la
 * cuadrícula entera desaparece de golpe cuando llegan los datos de verdad. No
 * hay estado que se pueda quedar pegado a la fila equivocada porque no hay
 * estado.
 */
export function SkeletonTabla({ columnas = 5, filas = 6, conBusqueda = true }: SkeletonTablaProps) {
  return (
    <Box>
      {conBusqueda ? <Skeleton variant="rounded" width={320} height={40} sx={{ mb: 2 }} /> : null}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          {Array.from({ length: filas }).map((_, fila) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: cuadrícula fija sin datos ni estado
            <Stack key={`fila-${fila}`} direction="row" spacing={2}>
              {Array.from({ length: columnas }).map((_, col) => (
                <Skeleton
                  // biome-ignore lint/suspicious/noArrayIndexKey: cuadrícula fija sin datos ni estado
                  key={`celda-${fila}-${col}`}
                  variant="text"
                  height={28}
                  sx={{ flex: 1 }}
                />
              ))}
            </Stack>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
}
