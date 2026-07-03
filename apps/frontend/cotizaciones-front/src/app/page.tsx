"use client";

import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchIcon from "@mui/icons-material/Search";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
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
  type Columna,
  type Cotizacion,
  type EstadoCotizacion,
  PRODUCTOS_MOCK,
  PageHeader,
  Permiso,
  type Producto,
  formatearFecha,
  formatearMoneda,
  usePermisos,
} from "@scipos/frontend-commons";
import { useMemo, useState } from "react";
import { useCotizaciones } from "../store/CotizacionesContext";

const OPCIONES_ESTADO: { valor: EstadoCotizacion | "TODOS"; etiqueta: string }[] = [
  { valor: "TODOS", etiqueta: "Todos los estados" },
  { valor: "BORRADOR", etiqueta: "Borrador" },
  { valor: "ENVIADA", etiqueta: "Enviada" },
  { valor: "CONVERTIDA", etiqueta: "Convertida" },
];

const ESTADO_CHIP: Record<
  EstadoCotizacion,
  { etiqueta: string; color: "default" | "info" | "success" }
> = {
  BORRADOR: { etiqueta: "Borrador", color: "default" },
  ENVIADA: { etiqueta: "Enviada", color: "info" },
  CONVERTIDA: { etiqueta: "Convertida", color: "success" },
};

const CLIENTES_ACTIVOS = CLIENTES_MOCK.filter((c) => c.activo);
const PRODUCTOS_ACTIVOS = PRODUCTOS_MOCK.filter((p) => p.activo);

function nombreCliente(clienteId: string): string {
  return CLIENTES_MOCK.find((c) => c.id === clienteId)?.nombre ?? "Cliente no encontrado";
}

function totalCotizacion(cotizacion: Cotizacion): number {
  return cotizacion.partidas.reduce(
    (acc, partida) => acc + partida.cantidad * partida.precioUnitario,
    0,
  );
}

interface FilaPartida {
  productoId: string;
  cantidad: number;
}

interface ModalNuevaCotizacionProps {
  open: boolean;
  onClose: () => void;
  onCreada: (id: string) => void;
}

/** Modal de alta de cotización: cliente, productos, folio y total automáticos. */
function ModalNuevaCotizacion({ open, onClose, onCreada }: ModalNuevaCotizacionProps) {
  const { crearCotizacion } = useCotizaciones();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [partidas, setPartidas] = useState<FilaPartida[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reiniciar = () => {
    setCliente(null);
    setPartidas([]);
    setError(null);
  };

  const cerrar = () => {
    reiniciar();
    onClose();
  };

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
    reiniciar();
    onCreada(nueva.id);
  };

  return (
    <Dialog open={open} onClose={cerrar} maxWidth="md" fullWidth>
      <DialogTitle>Nueva cotización</DialogTitle>
      <DialogContent dividers>
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
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1 }}
            >
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
                          p.id === partida.productoId ||
                          !partidas.some((f) => f.productoId === p.id),
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
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={cerrar}>Cancelar</Button>
        <Button variant="contained" onClick={guardar}>
          Guardar cotización
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface ModalDetalleCotizacionProps {
  open: boolean;
  id: string | null;
  onClose: () => void;
}

/** Modal de detalle: partidas, total y conversión a venta sin recapturar datos. */
function ModalDetalleCotizacion({ open, id, onClose }: ModalDetalleCotizacionProps) {
  const { obtenerPorId, convertirAVenta } = useCotizaciones();
  const [ventaGenerada, setVentaGenerada] = useState(false);

  const cotizacion = id ? obtenerPorId(id) : undefined;

  const cerrar = () => {
    setVentaGenerada(false);
    onClose();
  };

  if (!cotizacion) {
    return null;
  }

  const cliente = CLIENTES_MOCK.find((c) => c.id === cotizacion.clienteId);
  const total = totalCotizacion(cotizacion);
  const chip = ESTADO_CHIP[cotizacion.estado];

  const convertir = () => {
    convertirAVenta(cotizacion.id);
    setVentaGenerada(true);
  };

  return (
    <Dialog open={open} onClose={cerrar} maxWidth="md" fullWidth>
      <DialogTitle>Cotización {cotizacion.folio}</DialogTitle>
      <DialogContent dividers>
        {ventaGenerada ? (
          <Alert icon={<CheckCircleIcon fontSize="inherit" />} severity="success" sx={{ mb: 3 }}>
            Venta generada a partir de la cotización {cotizacion.folio} por {formatearMoneda(total)}
            , sin recapturar datos.
          </Alert>
        ) : null}
        <Stack spacing={1} sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Estado:
            </Typography>
            <Chip size="small" color={chip.color} label={chip.etiqueta} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Cliente: {cliente?.nombre ?? "No encontrado"}
          </Typography>
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
      </DialogContent>
      <DialogActions>
        <Button onClick={cerrar}>Cerrar</Button>
        {cotizacion.estado !== "CONVERTIDA" ? (
          <Permiso requiere="cotizaciones:convertir">
            <Button variant="contained" startIcon={<SwapHorizIcon />} onClick={convertir}>
              Convertir a venta
            </Button>
          </Permiso>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}

/**
 * Pantalla completa del módulo de Cotizaciones (listado + alta + detalle).
 * Contenido puro: no incluye Sidebar/Topbar, esos los aporta quien la
 * hospede (el AppShell local al correr standalone, o el web-shell cuando se
 * embebe vía `@scipos/cotizaciones-front`).
 */
export default function CotizacionesPage() {
  const { can } = usePermisos();
  const { cotizaciones } = useCotizaciones();
  const [clienteId, setClienteId] = useState("TODOS");
  const [estado, setEstado] = useState<EstadoCotizacion | "TODOS">("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [nuevaAbierta, setNuevaAbierta] = useState(false);
  const [detalleId, setDetalleId] = useState<string | null>(null);

  const columnas: Columna<Cotizacion>[] = [
    { clave: "folio", titulo: "Folio", render: (c) => c.folio },
    { clave: "cliente", titulo: "Cliente", render: (c) => nombreCliente(c.clienteId) },
    { clave: "fecha", titulo: "Fecha", render: (c) => formatearFecha(c.fecha) },
    {
      clave: "total",
      titulo: "Total",
      align: "right",
      render: (c) => formatearMoneda(totalCotizacion(c)),
    },
    {
      clave: "estado",
      titulo: "Estado",
      render: (c) => {
        const chip = ESTADO_CHIP[c.estado];
        return <Chip size="small" color={chip.color} label={chip.etiqueta} />;
      },
    },
    {
      clave: "acciones",
      titulo: "Acciones",
      align: "right",
      render: (c) => (
        <IconButton size="small" onClick={() => setDetalleId(c.id)} aria-label="Ver detalle">
          <VisibilityIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  const filas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return cotizaciones.filter((c) => {
      if (clienteId !== "TODOS" && c.clienteId !== clienteId) return false;
      if (estado !== "TODOS" && c.estado !== estado) return false;
      if (termino) {
        const texto = `${c.folio} ${nombreCliente(c.clienteId)}`.toLowerCase();
        if (!texto.includes(termino)) return false;
      }
      return true;
    });
  }, [cotizaciones, clienteId, estado, busqueda]);

  if (!can("cotizaciones:ver")) {
    return (
      <Container maxWidth="lg">
        <PageHeader titulo="Cotizaciones" />
        <Alert severity="warning">
          No tienes privilegios para ver cotizaciones con el rol actual.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <PageHeader
        titulo="Cotizaciones"
        descripcion="Historial de cotizaciones y su conversión a venta."
        acciones={
          <Permiso requiere="cotizaciones:crear">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setNuevaAbierta(true)}
            >
              Nueva cotización
            </Button>
          </Permiso>
        }
      />
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ sm: "center" }}
        sx={{ mb: 2 }}
      >
        <TextField
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por folio o cliente..."
          size="small"
          sx={{ flexGrow: 1, minWidth: 220 }}
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
        <TextField
          select
          size="small"
          label="Cliente"
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="TODOS">Todos los clientes</MenuItem>
          {CLIENTES_MOCK.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.nombre}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Estado"
          value={estado}
          onChange={(e) => setEstado(e.target.value as EstadoCotizacion | "TODOS")}
          sx={{ minWidth: 180 }}
        >
          {OPCIONES_ESTADO.map((op) => (
            <MenuItem key={op.valor} value={op.valor}>
              {op.etiqueta}
            </MenuItem>
          ))}
        </TextField>
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
            {filas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnas.length} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No hay cotizaciones que coincidan con los filtros.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filas.map((c) => (
                <TableRow key={c.id} hover>
                  {columnas.map((col) => (
                    <TableCell key={col.clave} align={col.align ?? "left"}>
                      {col.render(c)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ModalNuevaCotizacion
        open={nuevaAbierta}
        onClose={() => setNuevaAbierta(false)}
        onCreada={(id) => {
          setNuevaAbierta(false);
          setDetalleId(id);
        }}
      />
      <ModalDetalleCotizacion
        open={detalleId !== null}
        id={detalleId}
        onClose={() => setDetalleId(null)}
      />
    </Container>
  );
}
