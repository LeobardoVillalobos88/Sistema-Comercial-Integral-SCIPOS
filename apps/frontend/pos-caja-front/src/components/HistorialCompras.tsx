"use client";

import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { SkeletonTabla, formatearFechaConHora, formatearMoneda } from "@scipos/frontend-commons";
import type { CompraApi } from "../api/posApi";
import { PanelSeccion } from "./PanelSeccion";

export interface HistorialComprasProps {
  compras: CompraApi[];
  cargando: boolean;
}

/**
 * Historial de compras a proveedores.
 *
 * Es la única vista donde se lee el proveedor: la pantalla de captura lo pide y
 * la skill de Alexa también, pero hasta aquí no había dónde consultarlo. Cada
 * renglón resume la compra y enumera sus partidas, porque una compra sin saber
 * qué entró no dice nada útil.
 */
export function HistorialCompras({ compras, cargando }: HistorialComprasProps) {
  if (cargando) {
    return (
      <PanelSeccion titulo="Historial de compras" descripcion="Entradas de mercancía registradas">
        <SkeletonTabla filas={4} columnas={5} conBusqueda={false} />
      </PanelSeccion>
    );
  }

  return (
    <PanelSeccion
      titulo="Historial de compras"
      descripcion="Entradas de mercancía registradas, de la más reciente a la más antigua"
    >
      {compras.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Todavía no hay compras registradas.
          </Typography>
        </Paper>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Proveedor</TableCell>
                <TableCell>Productos</TableCell>
                <TableCell align="right">Piezas</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {compras.map((compra) => (
                <TableRow key={compra.id} hover>
                  <TableCell>{formatearFechaConHora(compra.fecha)}</TableCell>
                  <TableCell>
                    {compra.proveedor ? (
                      compra.proveedor
                    ) : (
                      <Chip label="Sin proveedor" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.25}>
                      {compra.partidas.map((partida) => (
                        <Typography key={partida.productoId} variant="body2">
                          {partida.nombre}
                          <Typography component="span" variant="body2" color="text.secondary">
                            {" "}
                            · {partida.cantidad} × {formatearMoneda(partida.precioCompra)}
                          </Typography>
                        </Typography>
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">{compra.piezas}</TableCell>
                  <TableCell align="right">{formatearMoneda(compra.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </PanelSeccion>
  );
}
