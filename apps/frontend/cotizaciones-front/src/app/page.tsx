"use client";

import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchIcon from "@mui/icons-material/Search";
import SendIcon from "@mui/icons-material/Send";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import LinearProgress from "@mui/material/LinearProgress";
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
  type Cliente,
  type Columna,
  ErrorApi,
  type EstadoCotizacion,
  EstadoCotizacionChip,
  PageHeader,
  Permiso,
  type Producto,
  formatearFecha,
  formatearMoneda,
  llamarApi,
  usePermisos,
} from "@scipos/frontend-commons";
import { confirmar, useToast } from "@scipos/frontend-commons/feedback";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCotizaciones } from "../store/CotizacionesContext";
import type { CotizacionApi } from "../tipos";

const OPCIONES_ESTADO: { valor: EstadoCotizacion | "TODOS"; etiqueta: string }[] = [
  { valor: "TODOS", etiqueta: "Todos los estados" },
  { valor: "BORRADOR", etiqueta: "Borrador" },
  { valor: "ENVIADA", etiqueta: "Enviada" },
  { valor: "VENDIDA", etiqueta: "Vendida" },
];

function mensajeError(error: unknown, mensajePorDefecto: string): string {
  return error instanceof ErrorApi || error instanceof Error ? error.message : mensajePorDefecto;
}

interface FilaPartida {
  productoId: string;
  cantidad: number;
}

interface ModalNuevaCotizacionProps {
  open: boolean;
  onClose: () => void;
  onCreada: (id: string) => void;
  clientes: Cliente[];
  productos: Producto[];
  catalogosCargando: boolean;
}

/** Modal de alta de cotización: cliente, productos, folio y total automáticos. */
function ModalNuevaCotizacion({
  open,
  onClose,
  onCreada,
  clientes,
  productos,
  catalogosCargando,
}: ModalNuevaCotizacionProps) {
  const { crearCotizacion } = useCotizaciones();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [partidas, setPartidas] = useState<FilaPartida[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const clientesActivos = useMemo(() => clientes.filter((item) => item.activo), [clientes]);
  const productosActivos = useMemo(() => productos.filter((item) => item.activo), [productos]);

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
    const disponible = productosActivos.find(
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
        const producto = productos.find((p) => p.id === partida.productoId);
        return acc + (producto?.precioVenta ?? 0) * partida.cantidad;
      }, 0),
    [partidas, productos],
  );

  const guardar = async () => {
    if (!cliente) {
      setError("Selecciona un cliente.");
      return;
    }
    if (partidas.length === 0 || partidas.some((p) => p.cantidad <= 0)) {
      setError("Agrega al menos un producto con cantidad mayor a cero.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const nueva = await crearCotizacion({
        clienteId: cliente.id,
        partidas: partidas.map((p) => ({
          productoId: p.productoId,
          cantidad: p.cantidad,
        })),
      });
      reiniciar();
      onCreada(nueva.id);
    } catch (errorGuardado) {
      setError(mensajeError(errorGuardado, "No se pudo crear la cotización."));
    } finally {
      setGuardando(false);
    }
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
            options={clientesActivos}
            getOptionLabel={(c) => c.nombre}
            value={cliente}
            onChange={(_, value) => setCliente(value)}
            loading={catalogosCargando}
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
                disabled={
                  catalogosCargando ||
                  productosActivos.length === 0 ||
                  partidas.length >= productosActivos.length
                }
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
                      const producto = productos.find((p) => p.id === partida.productoId);
                      const subtotal = (producto?.precioVenta ?? 0) * partida.cantidad;
                      const opcionesDisponibles = productosActivos.filter(
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
                              getOptionLabel={(p: Producto) => `${p.lote} · ${p.nombre}`}
                              value={producto}
                              onChange={(_, value) =>
                                value && actualizarPartida(index, { productoId: value.id })
                              }
                              renderInput={(params) => <TextField {...params} />}
                              disableClearable
                            />
                          </TableCell>
                          <TableCell align="right">
                            {formatearMoneda(producto?.precioVenta ?? 0)}
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
            <Typography variant="h6">Subtotal estimado: {formatearMoneda(total)}</Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" textAlign="right">
            El backend confirmará precios, IVA y total al guardar.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={cerrar}>Cancelar</Button>
        <Button variant="contained" onClick={guardar} disabled={guardando || catalogosCargando}>
          {guardando ? "Guardando..." : "Guardar cotización"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface ModalDetalleCotizacionProps {
  open: boolean;
  id: string | null;
  onClose: () => void;
  clientes: Cliente[];
}

/** Modal de detalle: partidas, total y conversión a venta sin recapturar datos. */
function ModalDetalleCotizacion({ open, id, onClose, clientes }: ModalDetalleCotizacionProps) {
  const { obtenerPorId, marcarEnviada, convertirAVenta } = useCotizaciones();
  const toast = useToast();
  const [ventaGenerada, setVentaGenerada] = useState(false);
  const [accionEnCurso, setAccionEnCurso] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cotizacion = id ? obtenerPorId(id) : undefined;

  const cerrar = () => {
    setVentaGenerada(false);
    setError(null);
    onClose();
  };

  if (!cotizacion) {
    return null;
  }

  const cliente = clientes.find((item) => item.id === cotizacion.clienteId);

  const convertir = async () => {
    setAccionEnCurso(true);
    setError(null);
    try {
      await convertirAVenta(cotizacion.id);
      setVentaGenerada(true);
      toast.exito("Cotización convertida a venta.");
    } catch (errorConversion) {
      const mensaje = mensajeError(errorConversion, "No se pudo convertir la cotización.");
      setError(mensaje);
      toast.error(mensaje);
    } finally {
      setAccionEnCurso(false);
    }
  };

  const enviar = async () => {
    setAccionEnCurso(true);
    setError(null);
    try {
      await marcarEnviada(cotizacion.id);
      toast.info("Cotización marcada como enviada.");
    } catch (errorEnvio) {
      const mensaje = mensajeError(errorEnvio, "No se pudo enviar la cotización.");
      setError(mensaje);
      toast.error(mensaje);
    } finally {
      setAccionEnCurso(false);
    }
  };

  return (
    <Dialog open={open} onClose={cerrar} maxWidth="md" fullWidth>
      <DialogTitle>Cotización {cotizacion.folio}</DialogTitle>
      <DialogContent dividers>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        ) : null}
        {ventaGenerada ? (
          <Alert icon={<CheckCircleIcon fontSize="inherit" />} severity="success" sx={{ mb: 3 }}>
            Venta generada a partir de la cotización {cotizacion.folio} por{" "}
            {formatearMoneda(cotizacion.total)}, sin recapturar datos.
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
            Cliente: {cotizacion.clienteNombre}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fecha: {formatearFecha(cotizacion.creadaEn)}
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
              {cotizacion.partidas.map((partida) => {
                return (
                  <TableRow key={partida.id}>
                    <TableCell>{partida.productoNombre}</TableCell>
                    <TableCell align="right">{formatearMoneda(partida.precioUnitario)}</TableCell>
                    <TableCell align="right">{partida.cantidad}</TableCell>
                    <TableCell align="right">{formatearMoneda(partida.importe)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <Stack spacing={0.5} alignItems="flex-end" sx={{ mt: 2 }}>
          <Typography variant="body2">Subtotal: {formatearMoneda(cotizacion.subtotal)}</Typography>
          <Typography variant="body2">IVA: {formatearMoneda(cotizacion.iva)}</Typography>
          <Typography variant="h6">Total: {formatearMoneda(cotizacion.total)}</Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={cerrar}>Cerrar</Button>
        {cotizacion.estado === "BORRADOR" ? (
          <Permiso requiere="cotizaciones:enviar">
            <Button
              variant="outlined"
              startIcon={<SendIcon />}
              onClick={enviar}
              disabled={accionEnCurso}
            >
              Marcar como enviada
            </Button>
          </Permiso>
        ) : null}
        {cotizacion.estado === "ENVIADA" ? (
          <Permiso requiere="cotizaciones:convertir">
            <Button
              variant="contained"
              startIcon={<SwapHorizIcon />}
              onClick={convertir}
              disabled={accionEnCurso}
            >
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
  const { can, usuario, cargandoPermisos } = usePermisos();
  const { cotizaciones, cargando, errorCarga, recargar, eliminar } = useCotizaciones();
  const toast = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [catalogosCargando, setCatalogosCargando] = useState(true);
  const [errorCatalogos, setErrorCatalogos] = useState<string | null>(null);
  const [clienteId, setClienteId] = useState("TODOS");

  const cargarCatalogos = useCallback(async () => {
    setCatalogosCargando(true);
    setErrorCatalogos(null);
    try {
      const [clientesApi, productosApi] = await Promise.all([
        llamarApi<Cliente[]>("/clientes"),
        llamarApi<Producto[]>("/productos/productos"),
      ]);
      setClientes(clientesApi);
      setProductos(productosApi);
    } catch (error) {
      setClientes([]);
      setProductos([]);
      setErrorCatalogos(
        mensajeError(error, "No se pudieron cargar los catálogos de clientes y productos."),
      );
    } finally {
      setCatalogosCargando(false);
    }
  }, []);

  useEffect(() => {
    if (cargandoPermisos) {
      return;
    }
    if (!usuario) {
      setClientes([]);
      setProductos([]);
      setErrorCatalogos("No fue posible identificar al usuario activo contra seguridad.");
      setCatalogosCargando(false);
      return;
    }
    void cargarCatalogos();
  }, [cargandoPermisos, usuario, cargarCatalogos]);

  const eliminarCotizacion = async (cotizacion: CotizacionApi) => {
    const confirmado = await confirmar({
      titulo: "¿Eliminar cotización?",
      texto: `La cotización ${cotizacion.folio} se eliminará permanentemente.`,
      confirmar: "Sí, eliminar",
    });
    if (!confirmado) {
      return;
    }
    try {
      await eliminar(cotizacion.id);
      toast.info("Cotización eliminada.");
    } catch (error) {
      toast.error(mensajeError(error, "No se pudo eliminar la cotización."));
    }
  };
  const [estado, setEstado] = useState<EstadoCotizacion | "TODOS">("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [nuevaAbierta, setNuevaAbierta] = useState(false);
  const [detalleId, setDetalleId] = useState<string | null>(null);

  const columnas: Columna<CotizacionApi>[] = [
    { clave: "folio", titulo: "Folio", render: (c) => c.folio },
    { clave: "cliente", titulo: "Cliente", render: (c) => c.clienteNombre },
    { clave: "fecha", titulo: "Fecha", render: (c) => formatearFecha(c.creadaEn) },
    {
      clave: "total",
      titulo: "Total",
      align: "right",
      render: (c) => formatearMoneda(c.total),
    },
    {
      clave: "estado",
      titulo: "Estado",
      render: (c) => <EstadoCotizacionChip estado={c.estado} />,
    },
    {
      clave: "acciones",
      titulo: "Acciones",
      align: "right",
      render: (c) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <IconButton
            size="small"
            color="primary"
            onClick={() => setDetalleId(c.id)}
            aria-label="Ver detalle"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          {c.estado === "BORRADOR" ? (
            <Permiso requiere="cotizaciones:eliminar">
              <IconButton
                size="small"
                color="error"
                onClick={() => eliminarCotizacion(c)}
                aria-label="Eliminar cotización"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Permiso>
          ) : null}
        </Stack>
      ),
    },
  ];

  const filas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return cotizaciones.filter((c) => {
      if (clienteId !== "TODOS" && c.clienteId !== clienteId) return false;
      if (estado !== "TODOS" && c.estado !== estado) return false;
      if (termino) {
        const texto = `${c.folio} ${c.clienteNombre}`.toLowerCase();
        if (!texto.includes(termino)) return false;
      }
      return true;
    });
  }, [cotizaciones, clienteId, estado, busqueda]);

  if (!can("cotizaciones:ver")) {
    return (
      <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
        <PageHeader titulo="Cotizaciones" />
        <Alert severity="warning">
          No tienes privilegios para ver cotizaciones con el rol actual.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
      <PageHeader
        titulo="Cotizaciones"
        descripcion="Historial de cotizaciones y su conversión a venta."
        acciones={
          <Permiso requiere="cotizaciones:crear">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setNuevaAbierta(true)}
              disabled={catalogosCargando || Boolean(errorCatalogos)}
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
          {clientes.map((c) => (
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
      {cargando || cargandoPermisos ? <LinearProgress sx={{ mb: 2 }} /> : null}
      {errorCarga ? (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            usuario ? (
              <Button color="inherit" size="small" onClick={() => void recargar()}>
                Reintentar
              </Button>
            ) : undefined
          }
        >
          {errorCarga}
        </Alert>
      ) : null}
      {errorCatalogos ? (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            usuario ? (
              <Button color="inherit" size="small" onClick={() => void cargarCatalogos()}>
                Reintentar
              </Button>
            ) : undefined
          }
        >
          {errorCatalogos} No se podrán crear cotizaciones hasta recuperarlos.
        </Alert>
      ) : null}
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
        clientes={clientes}
        productos={productos}
        catalogosCargando={catalogosCargando}
        onCreada={(id) => {
          setNuevaAbierta(false);
          setDetalleId(id);
          toast.exito("Cotización creada.");
        }}
      />
      <ModalDetalleCotizacion
        open={detalleId !== null}
        id={detalleId}
        onClose={() => setDetalleId(null)}
        clientes={clientes}
      />
    </Container>
  );
}
