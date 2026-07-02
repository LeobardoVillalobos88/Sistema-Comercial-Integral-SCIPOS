"use client";

import { EstadoCotizacionChip } from "@/components/EstadoCotizacionChip";
import { useCotizaciones } from "@/store/CotizacionesContext";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import {
  CLIENTES_MOCK,
  PRODUCTOS_MOCK,
  PageHeader,
  Permiso,
  formatearFecha,
  formatearMoneda,
  usePermisos,
} from "@scipos/frontend-commons";
import { notFound, useRouter } from "next/navigation";
import { use, useState } from "react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DetalleCotizacionPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { can } = usePermisos();
  const { obtenerPorId, convertirAVenta } = useCotizaciones();
  const [ventaGenerada, setVentaGenerada] = useState(false);

  const cotizacion = obtenerPorId(id);
  if (!cotizacion) {
    notFound();
  }

  if (!can("cotizaciones:ver")) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <PageHeader titulo="Cotización" />
        <Alert severity="warning">
          No tienes privilegios para ver cotizaciones con el rol actual.
        </Alert>
      </Container>
    );
  }

  const cliente = CLIENTES_MOCK.find((c) => c.id === cotizacion.clienteId);
  const total = cotizacion.partidas.reduce(
    (acc, partida) => acc + partida.cantidad * partida.precioUnitario,
    0,
  );

  const convertir = () => {
    convertirAVenta(cotizacion.id);
    setVentaGenerada(true);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <PageHeader
        titulo={`Cotización ${cotizacion.folio}`}
        descripcion={`Cliente: ${cliente?.nombre ?? "No encontrado"}`}
        acciones={
          cotizacion.estado !== "CONVERTIDA" ? (
            <Permiso requiere="cotizaciones:convertir">
              <Button variant="contained" startIcon={<SwapHorizIcon />} onClick={convertir}>
                Convertir a venta
              </Button>
            </Permiso>
          ) : null
        }
      />

      {ventaGenerada ? (
        <Alert icon={<CheckCircleIcon fontSize="inherit" />} severity="success" sx={{ mb: 3 }}>
          Venta generada a partir de la cotización {cotizacion.folio} por {formatearMoneda(total)},
          sin recapturar datos.
        </Alert>
      ) : null}

      <Stack spacing={1} sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Estado:
          </Typography>
          <EstadoCotizacionChip estado={cotizacion.estado} />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Fecha: {formatearFecha(cotizacion.fecha)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Teléfono: {cliente?.telefono ?? "—"} · Correo: {cliente?.correo ?? "—"}
        </Typography>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Producto</TableCell>
              <TableCell align="right">Precio unitario</TableCell>
              <TableCell align="right">Cantidad</TableCell>
              <TableCell align="right">Subtotal</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cotizacion.partidas.map((partida, index) => {
              const producto = PRODUCTOS_MOCK.find((p) => p.id === partida.productoId);
              return (
                <TableRow key={`${partida.productoId}-${index}`}>
                  <TableCell>{producto?.nombre ?? "Producto no encontrado"}</TableCell>
                  <TableCell align="right">{formatearMoneda(partida.precioUnitario)}</TableCell>
                  <TableCell align="right">{partida.cantidad}</TableCell>
                  <TableCell align="right">
                    {formatearMoneda(partida.cantidad * partida.precioUnitario)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
        <Typography variant="h6">Total: {formatearMoneda(total)}</Typography>
      </Stack>

      <Box sx={{ mt: 3 }}>
        <Button onClick={() => router.push("/")}>Volver al listado</Button>
      </Box>
    </Container>
  );
}
