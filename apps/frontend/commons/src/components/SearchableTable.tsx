"use client";

import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";

export interface Columna<T> {
  /** Clave única de la columna. */
  clave: string;
  /** Encabezado mostrado. */
  titulo: string;
  /** Cómo renderizar la celda para una fila. */
  render: (fila: T) => React.ReactNode;
  align?: "left" | "right" | "center";
}

export interface SearchableTableProps<T> {
  filas: T[];
  columnas: Columna<T>[];
  /** Texto a buscar dentro de cada fila (se concatena para el filtro). */
  textoBusqueda: (fila: T) => string;
  placeholderBusqueda?: string;
  /** Mensaje cuando no hay resultados. */
  mensajeVacio?: string;
}

/**
 * Tabla con búsqueda integrada. Componente base del Design System para listar
 * datos (productos, clientes, etc.) de forma consistente.
 */
export function SearchableTable<T>({
  filas,
  columnas,
  textoBusqueda,
  placeholderBusqueda = "Buscar...",
  mensajeVacio = "No hay registros que coincidan con la búsqueda.",
}: SearchableTableProps<T>) {
  const [busqueda, setBusqueda] = useState("");

  const filasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) {
      return filas;
    }
    return filas.filter((fila) => textoBusqueda(fila).toLowerCase().includes(termino));
  }, [busqueda, filas, textoBusqueda]);

  return (
    <Box>
      <TextField
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder={placeholderBusqueda}
        size="small"
        fullWidth
        sx={{ mb: 2, maxWidth: 360 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              {columnas.map((col) => (
                <TableCell key={col.clave} align={col.align ?? "left"}>
                  <strong>{col.titulo}</strong>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filasFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnas.length} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    {mensajeVacio}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filasFiltradas.map((fila, idx) => (
                <TableRow key={idx} hover>
                  {columnas.map((col) => (
                    <TableCell key={col.clave} align={col.align ?? "left"}>
                      {col.render(fila)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
