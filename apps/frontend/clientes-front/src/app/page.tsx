"use client";

import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid2 from "@mui/material/Grid2";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import {
  CLIENTES_MOCK,
  type Cliente,
  type Columna,
  EstadoChip,
  EstadoCotizacionChip,
  PageHeader,
  Permiso,
  SearchableTable,
  formatearFecha,
  formatearMoneda,
  totalCotizacion,
} from "@scipos/frontend-commons";
import { confirmar, useToast } from "@scipos/frontend-commons/feedback";
import { useState } from "react";
import { COTIZACIONES_MOCK_HISTORIAL, VENTAS_MOCK_HISTORIAL } from "../mocks/clientesData";

interface ErroresFormulario {
  nombre?: string;
  rfc?: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
}

export default function ClientesPage() {
  const toast = useToast();

  // Estado principal de clientes (iniciado con los datos mock de commons)
  const [clientes, setClientes] = useState<Cliente[]>(CLIENTES_MOCK);

  // Estados para modales
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  // Estados de carga de datos para formularios y detalle
  const [clienteEdicion, setClienteEdicion] = useState<Cliente | null>(null);
  const [clienteDetalle, setClienteDetalle] = useState<Cliente | null>(null);

  // Campos de formulario
  const [nombre, setNombre] = useState("");
  const [rfc, setRfc] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [direccion, setDireccion] = useState("");
  const [errores, setErrores] = useState<ErroresFormulario>({});

  // 1. Abrir Modal para crear un nuevo cliente
  const handleNuevoCliente = () => {
    setClienteEdicion(null);
    setNombre("");
    setRfc("");
    setTelefono("");
    setCorreo("");
    setDireccion("");
    setErrores({});
    setModalAbierto(true);
  };

  // 2. Abrir Modal para editar un cliente existente
  const handleEditarCliente = (cliente: Cliente) => {
    setClienteEdicion(cliente);
    setNombre(cliente.nombre);
    setRfc(cliente.rfc || "");
    setTelefono(cliente.telefono);
    setCorreo(cliente.correo);
    setDireccion(cliente.direccion);
    setErrores({});
    setModalAbierto(true);
  };

  // 3. Abrir Modal para ver detalle e historial
  const handleVerDetalle = (cliente: Cliente) => {
    setClienteDetalle(cliente);
    setTabIndex(0);
    setModalDetalleAbierto(true);
  };

  // 4. Activar/Desactivar Cliente (RF-11/RF-12 lógico)
  const handleAlternarEstado = async (cliente: Cliente) => {
    if (cliente.activo) {
      const confirmado = await confirmar({
        titulo: "¿Desactivar cliente?",
        texto: `"${cliente.nombre}" quedará como inactivo.`,
        confirmar: "Sí, desactivar",
      });
      if (!confirmado) {
        return;
      }
    }
    setClientes((prev) => prev.map((c) => (c.id === cliente.id ? { ...c, activo: !c.activo } : c)));
    toast.info(cliente.activo ? "Cliente desactivado." : "Cliente activado.");
  };

  // 4b. Eliminar cliente (acción destructiva, solo Admin).
  const handleEliminarCliente = async (cliente: Cliente) => {
    const confirmado = await confirmar({
      titulo: "¿Eliminar cliente?",
      texto: `"${cliente.nombre}" se eliminará permanentemente.`,
      confirmar: "Sí, eliminar",
    });
    if (!confirmado) {
      return;
    }
    setClientes((prev) => prev.filter((c) => c.id !== cliente.id));
    toast.info("Cliente eliminado.");
  };

  // 5. Validaciones básicas del formulario
  const validarFormulario = (): boolean => {
    const nuevosErrores: ErroresFormulario = {};

    if (!nombre.trim()) nuevosErrores.nombre = "El nombre es obligatorio.";
    if (!telefono.trim()) {
      nuevosErrores.telefono = "El teléfono es obligatorio.";
    } else if (!/^\d{10}$/.test(telefono.replace(/[-\s]/g, ""))) {
      nuevosErrores.telefono = "El teléfono debe contener 10 dígitos.";
    }

    if (!correo.trim()) {
      nuevosErrores.correo = "El correo electrónico es obligatorio.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      nuevosErrores.correo = "El correo no tiene un formato válido.";
    }

    if (!direccion.trim()) nuevosErrores.direccion = "La dirección es obligatoria.";

    if (rfc.trim() && !/^[A-Z&Ññ]{3,4}\d{6}[A-Z0-9]{3}$/i.test(rfc)) {
      nuevosErrores.rfc = "RFC inválido (debe tener formato homoclave de 12 o 13 caracteres).";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // 6. Guardar formulario (Crear o Editar)
  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    if (clienteEdicion) {
      // Editar
      setClientes((prev) =>
        prev.map((c) =>
          c.id === clienteEdicion.id
            ? { ...c, nombre, rfc: rfc || undefined, telefono, correo, direccion }
            : c,
        ),
      );
    } else {
      // Crear
      const nuevo: Cliente = {
        id: `c-${String(clientes.length + 1).padStart(3, "0")}`,
        nombre,
        rfc: rfc || undefined,
        telefono,
        correo,
        direccion,
        activo: true,
      };
      setClientes((prev) => [...prev, nuevo]);
    }

    setModalAbierto(false);
    toast.exito(clienteEdicion ? "Cliente actualizado correctamente." : "Cliente registrado.");
  };

  // Cuentas de historial asociadas al cliente seleccionado para detalle
  const cotizacionesCliente = clienteDetalle
    ? COTIZACIONES_MOCK_HISTORIAL.filter((cot) => cot.clienteId === clienteDetalle.id)
    : [];

  const ventasCliente = clienteDetalle
    ? VENTAS_MOCK_HISTORIAL.filter((vta) => vta.clienteId === clienteDetalle.id)
    : [];

  const montoTotalComprado = ventasCliente.reduce((sum, vta) => sum + vta.total, 0);

  // Columnas para la tabla principal
  const columnas: Columna<Cliente>[] = [
    { clave: "nombre", titulo: "Nombre", render: (c) => c.nombre },
    {
      clave: "rfc",
      titulo: "RFC",
      render: (c) =>
        c.rfc || (
          <Typography variant="body2" component="span" color="text.disabled">
            Público en general
          </Typography>
        ),
    },
    {
      clave: "contacto",
      titulo: "Contacto",
      render: (c) => (
        <Box>
          <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <PhoneIcon fontSize="inherit" color="action" /> {c.telefono}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
          >
            <EmailIcon fontSize="inherit" color="action" /> {c.correo}
          </Typography>
        </Box>
      ),
    },
    { clave: "estado", titulo: "Estado", render: (c) => <EstadoChip activo={c.activo} /> },
    {
      clave: "acciones",
      titulo: "Acciones",
      align: "center",
      render: (c) => (
        <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
          <Tooltip title="Ver detalles e historial">
            <IconButton size="small" color="primary" onClick={() => handleVerDetalle(c)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Permiso requiere="clientes:editar">
            <Tooltip title={c.activo ? "Desactivar cliente" : "Activar cliente"}>
              <IconButton
                size="small"
                color={c.activo ? "success" : "default"}
                onClick={() => handleAlternarEstado(c)}
              >
                {c.activo ? <ToggleOnIcon fontSize="small" /> : <ToggleOffIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Permiso>

          <Permiso requiere="clientes:editar">
            <Tooltip title="Editar datos">
              <IconButton size="small" color="info" onClick={() => handleEditarCliente(c)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Permiso>

          <Permiso requiere="clientes:eliminar">
            <Tooltip title="Eliminar cliente">
              <IconButton size="small" color="error" onClick={() => handleEliminarCliente(c)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Permiso>
        </Box>
      ),
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <PageHeader
        titulo="Gestión de Clientes"
        descripcion="Administra la información de tus clientes y consulta su historial de cotizaciones y ventas."
        acciones={
          <Permiso requiere="clientes:crear">
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleNuevoCliente}>
              Nuevo Cliente
            </Button>
          </Permiso>
        }
      />

      {/* Tabla de Clientes con Búsqueda Integrada */}
      <Box sx={{ mt: 1 }}>
        <SearchableTable
          filas={clientes}
          columnas={columnas}
          textoBusqueda={(c) => `${c.nombre} ${c.rfc || ""} ${c.correo} ${c.telefono}`}
          placeholderBusqueda="Buscar por nombre, RFC, correo o teléfono..."
          mensajeVacio="No se encontraron clientes registrados con ese criterio."
        />
      </Box>

      {/* MODAL: ALTA Y EDICIÓN (CRUD) */}
      <Dialog open={modalAbierto} onClose={() => setModalAbierto(false)} fullWidth maxWidth="sm">
        <form onSubmit={handleGuardar}>
          <DialogTitle
            sx={{
              m: 0,
              p: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" component="span">
              {clienteEdicion ? "Editar Cliente" : "Registrar Nuevo Cliente"}
            </Typography>
            <IconButton onClick={() => setModalAbierto(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            <Grid2 container spacing={2}>
              <Grid2 size={{ xs: 12 }}>
                <TextField
                  label="Nombre Completo o Razón Social"
                  required
                  fullWidth
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  error={!!errores.nombre}
                  helperText={errores.nombre}
                  size="small"
                />
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="RFC (Opcional)"
                  placeholder="XAXX010101000"
                  fullWidth
                  value={rfc}
                  onChange={(e) => setRfc(e.target.value.toUpperCase())}
                  error={!!errores.rfc}
                  helperText={errores.rfc}
                  size="small"
                />
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Teléfono"
                  required
                  placeholder="10 dígitos"
                  fullWidth
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  error={!!errores.telefono}
                  helperText={errores.telefono}
                  size="small"
                />
              </Grid2>
              <Grid2 size={{ xs: 12 }}>
                <TextField
                  label="Correo Electrónico"
                  type="email"
                  required
                  fullWidth
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  error={!!errores.correo}
                  helperText={errores.correo}
                  size="small"
                />
              </Grid2>
              <Grid2 size={{ xs: 12 }}>
                <TextField
                  label="Dirección Completa"
                  required
                  multiline
                  rows={2}
                  fullWidth
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  error={!!errores.direccion}
                  helperText={errores.direccion}
                  size="small"
                />
              </Grid2>
            </Grid2>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setModalAbierto(false)} color="inherit">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" color="primary">
              Guardar Cliente
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* MODAL: VER DETALLE CON HISTORIAL (RF-12) */}
      <Dialog
        open={modalDetalleAbierto}
        onClose={() => setModalDetalleAbierto(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle
          sx={{
            m: 0,
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" component="span">
            Detalle del Cliente
          </Typography>
          <IconButton onClick={() => setModalDetalleAbierto(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {clienteDetalle && (
            <Grid2 container spacing={3}>
              {/* Resumen e información del cliente */}
              <Grid2 size={{ xs: 12, md: 4 }}>
                <Card variant="outlined" sx={{ height: "100%", bgcolor: "grey.50" }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {clienteDetalle.nombre}
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      ID: {clienteDetalle.id}
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>RFC:</strong> {clienteDetalle.rfc || "Público General"}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Teléfono:</strong> {clienteDetalle.telefono}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Correo:</strong> {clienteDetalle.correo}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      <strong>Dirección:</strong> {clienteDetalle.direccion}
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" component="span" sx={{ mr: 1 }}>
                        <strong>Estado:</strong>
                      </Typography>
                      <EstadoChip activo={clienteDetalle.activo} />
                    </Box>

                    {/* Resumen de Compras del Cliente */}
                    <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: "divider" }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Total Comprado (POS)
                      </Typography>
                      <Typography variant="h5" color="primary.main" fontWeight="bold">
                        {formatearMoneda(montoTotalComprado)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid2>

              {/* Pestañas de Historial */}
              <Grid2 size={{ xs: 12, md: 8 }}>
                <Box sx={{ width: "100%" }}>
                  <Tabs
                    value={tabIndex}
                    onChange={(_, newValue) => setTabIndex(newValue)}
                    sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
                  >
                    <Tab label={`Cotizaciones (${cotizacionesCliente.length})`} />
                    <Tab label={`Ventas Directas (${ventasCliente.length})`} />
                  </Tabs>

                  {/* Panel 0: Cotizaciones */}
                  {tabIndex === 0 && (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>
                              <strong>Folio</strong>
                            </TableCell>
                            <TableCell>
                              <strong>Fecha</strong>
                            </TableCell>
                            <TableCell>
                              <strong>Estado</strong>
                            </TableCell>
                            <TableCell align="right">
                              <strong>Total</strong>
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {cotizacionesCliente.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} align="center">
                                <Typography variant="caption" color="text.secondary">
                                  No hay cotizaciones para este cliente.
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            cotizacionesCliente.map((cot) => (
                              <TableRow key={cot.id}>
                                <TableCell>{cot.folio}</TableCell>
                                <TableCell>{formatearFecha(cot.fecha)}</TableCell>
                                <TableCell>
                                  <EstadoCotizacionChip estado={cot.estado} />
                                </TableCell>
                                <TableCell align="right">
                                  {formatearMoneda(totalCotizacion(cot))}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  {/* Panel 1: Ventas */}
                  {tabIndex === 1 && (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>
                              <strong>Folio</strong>
                            </TableCell>
                            <TableCell>
                              <strong>Fecha</strong>
                            </TableCell>
                            <TableCell>
                              <strong>Método de Pago</strong>
                            </TableCell>
                            <TableCell align="right">
                              <strong>Total</strong>
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {ventasCliente.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} align="center">
                                <Typography variant="caption" color="text.secondary">
                                  No hay ventas registradas para este cliente.
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            ventasCliente.map((vta) => (
                              <TableRow key={vta.id}>
                                <TableCell>{vta.folio}</TableCell>
                                <TableCell>{formatearFecha(vta.fecha)}</TableCell>
                                <TableCell>{vta.metodoPago}</TableCell>
                                <TableCell align="right">{formatearMoneda(vta.total)}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              </Grid2>
            </Grid2>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModalDetalleAbierto(false)} variant="contained">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
