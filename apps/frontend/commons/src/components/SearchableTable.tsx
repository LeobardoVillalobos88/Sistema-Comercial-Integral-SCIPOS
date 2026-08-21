"use client";

import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
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
  clave: string;
  titulo: string;
  render: (fila: T) => React.ReactNode;
  align?: "left" | "right" | "center";
}

export interface SearchableTableProps<T> {
  filas: T[];
  columnas: Columna<T>[];
  claveFila: (fila: T) => string | number;
  textoBusqueda: (fila: T) => string;
  placeholderBusqueda?: string;
  mensajeVacio?: string;
  filtros?: React.ReactNode;
}

export function SearchableTable<T>({
  filas,
  columnas,
  claveFila,
  textoBusqueda,
  placeholderBusqueda = "Buscar...",
  mensajeVacio = "No hay registros que coincidan con la búsqueda.",
  filtros,
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
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <TextField
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder={placeholderBusqueda}
          size="small"
          fullWidth
          sx={{ maxWidth: { sm: 360 } }}
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
        {filtros}
      </Stack>
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
              filasFiltradas.map((fila) => (
                <TableRow key={claveFila(fila)} hover>
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
