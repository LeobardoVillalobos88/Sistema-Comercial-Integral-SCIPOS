"use client";

import { useCotizaciones } from "@/store/CotizacionesContext";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
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
import {
  CLIENTES_MOCK,
  type Cliente,
  PRODUCTOS_MOCK,
  PageHeader,
  type Producto,
  formatearMoneda,
  usePermisos,
} from "@scipos/frontend-commons";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

interface FilaPartida {
  productoId: string;
  cantidad: number;
}

const CLIENTES_ACTIVOS = CLIENTES_MOCK.filter((c) => c.activo);
const PRODUCTOS_ACTIVOS = PRODUCTOS_MOCK.filter((p) => p.activo);

export default function NuevaCotizacionPage() {
  const router = useRouter();
  const { can } = usePermisos();
  const { crearCotizacion } = useCotizaciones();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [partidas, setPartidas] = useState<FilaPartida[]>([]);
  const [error, setError] = useState<string | null>(null);

  const agregarPartida = () => {
    const disponible = PRODUCTOS_ACTIVOS.find(
      (p) => !partidas.some((partida) => partida.productoId === p.id),
    );
    if (!disponible) return;
    setPartidas((prev) => [...prev, { productoId: disponible.id, cantidad: 1 }]);
  };

  const actualizarPartida = (index: number, cambios: Partial<FilaPartida>) => {
    setPartidas((prev) => prev.map((p, i) => (i === index ? { ...p, ...cambios } : p)));
  };

  const quitarPartida = (index: number) => {
    setPartidas((prev) => prev.filter((_, i) => i !== index));
  };

  const total = useMemo(
    () =>
      partidas.reduce((acc, partida) => {
        const producto = PRODUCTOS_MOCK.find((p) => p.id === partida.productoId);
        return acc + (producto?.precio ?? 0) * partida.cantidad;
      }, 0),
    [partidas],
  );

  const guardar = () => {
    if (!cliente) {
      setError("Selecciona un cliente.");
      return;
    }
    if (partidas.length === 0 || partidas.some((p) => p.cantidad <= 0)) {
      setError("Agrega al menos un producto con cantidad mayor a cero.");
      return;
    }
    const nueva = crearCotizacion({
      clienteId: cliente.id,
      partidas: partidas.map((p) => ({
        productoId: p.productoId,
        cantidad: p.cantidad,
        precioUnitario: PRODUCTOS_MOCK.find((prod) => prod.id === p.productoId)?.precio ?? 0,
      })),
    });
    router.push(`/${nueva.id}`);
  };

  if (!can("cotizaciones:crear")) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <PageHeader titulo="Nueva cotización" />
        <Alert severity="warning">
          No tienes privilegios para crear cotizaciones con el rol actual.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <PageHeader
        titulo="Nueva cotización"
        descripcion="Selecciona un cliente, agrega productos y genera el folio automáticamente."
      />
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}
      <Stack spacing={3}>
        <Autocomplete
          options={CLIENTES_ACTIVOS}
          getOptionLabel={(c) => c.nombre}
          value={cliente}
          onChange={(_, value) => setCliente(value)}
          renderInput={(params) => (
            <TextField {...params} label="Cliente" placeholder="Buscar cliente..." />
          )}
        />

        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="subtitle1">Productos</Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={agregarPartida}
              disabled={partidas.length >= PRODUCTOS_ACTIVOS.length}
            >
              Agregar producto
            </Button>
          </Stack>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell align="right">Precio</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
                  <TableCell align="right">Subtotal</TableCell>
                  <TableCell align="center">Quitar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {partidas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        Agrega al menos un producto.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  partidas.map((partida, index) => {
                    const producto = PRODUCTOS_MOCK.find((p) => p.id === partida.productoId);
                    const subtotal = (producto?.precio ?? 0) * partida.cantidad;
                    const opcionesDisponibles = PRODUCTOS_ACTIVOS.filter(
                      (p) =>
                        p.id === partida.productoId || !partidas.some((f) => f.productoId === p.id),
                    );
                    return (
                      <TableRow key={`${partida.productoId}-${index}`}>
                        <TableCell sx={{ minWidth: 240 }}>
                          <Autocomplete
                            size="small"
                            options={opcionesDisponibles}
                            getOptionLabel={(p: Producto) => `${p.clave} · ${p.nombre}`}
                            value={producto}
                            onChange={(_, value) =>
                              value && actualizarPartida(index, { productoId: value.id })
                            }
                            renderInput={(params) => <TextField {...params} />}
                            disableClearable
                          />
                        </TableCell>
                        <TableCell align="right">
                          {formatearMoneda(producto?.precio ?? 0)}
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={partida.cantidad}
                            onChange={(e) =>
                              actualizarPartida(index, {
                                cantidad: Math.max(1, Number(e.target.value) || 1),
                              })
                            }
                            slotProps={{ htmlInput: { min: 1, style: { textAlign: "right" } } }}
                            sx={{ width: 90 }}
                          />
                        </TableCell>
                        <TableCell align="right">{formatearMoneda(subtotal)}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => quitarPartida(index)}
                            aria-label="Quitar producto"
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Stack direction="row" justifyContent="flex-end">
          <Typography variant="h6">Total: {formatearMoneda(total)}</Typography>
        </Stack>

        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button onClick={() => router.push("/")}>Cancelar</Button>
          <Button variant="contained" onClick={guardar}>
            Guardar cotización
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
