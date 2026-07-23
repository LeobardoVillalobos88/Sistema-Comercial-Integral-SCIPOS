"use client";

import AddIcon from "@mui/icons-material/Add";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import DeleteIcon from "@mui/icons-material/Delete";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import RemoveIcon from "@mui/icons-material/Remove";
import SearchIcon from "@mui/icons-material/Search";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
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
  ETIQUETAS_ROL,
  EstadoChip,
  PageHeader,
  type PermisosContextValue,
  type Rol,
  SkeletonTabla,
  formatearFechaConHora,
  formatearMoneda,
  usePermisos,
} from "@scipos/frontend-commons";
import { useToast } from "@scipos/frontend-commons/feedback";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  abrirCaja as abrirCajaApi,
  abrirComprobanteVenta,
  cargarHistorialVentas,
  cerrarCaja as cerrarCajaApi,
  consultarEstadoCaja,
  crearCompra,
  crearVenta,
  listarClientesActivos,
  listarProductosPos,
  mensajeErrorApi,
  registrarMovimientoCaja,
  resumenCorteAUi,
  ventaApiAUi,
} from "./api/posApi";
import { CajaProvider, type TipoMovimientoCaja, useCaja } from "./context/CajaContext";
import type { CorteCaja, ItemCarrito, ProductoPos, VentaPOS } from "./types/pos";

/** "venta" usa el precio de venta y resta inventario; "compra" usa el precio de compra y suma. */
export type ModoPos = "venta" | "compra";

export interface PosCajaPageProps {
  defaultTab?: number;
  hideTabs?: boolean;
  modo?: ModoPos;
}

interface PanelSeccionProps {
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
  children: ReactNode;
}

interface ResumenMontoProps {
  etiqueta: string;
  valor: string;
  color?: string;
}

const IVA = 0.16;

function precioSegunModo(producto: ProductoPos, modo: ModoPos): number {
  return modo === "compra" ? producto.precioCompra : producto.precioVenta;
}

function crearItemCarrito(producto: ProductoPos, modo: ModoPos): ItemCarrito {
  const precio = precioSegunModo(producto, modo);
  return {
    productoId: producto.id,
    clave: producto.clave,
    nombre: producto.nombre,
    precioUnitario: precio,
    cantidad: 1,
    subtotal: precio,
  };
}

function PanelSeccion({ titulo, descripcion, acciones, children }: PanelSeccionProps) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardHeader title={titulo} subheader={descripcion} action={acciones} sx={{ pb: 0 }} />
      <CardContent sx={{ pt: 2 }}>{children}</CardContent>
    </Card>
  );
}

function ResumenMonto({ etiqueta, valor, color }: ResumenMontoProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {etiqueta}
      </Typography>
      <Typography variant="h6" sx={{ color }}>
        {valor}
      </Typography>
    </Paper>
  );
}

function TablaVentasHistoricas({
  ventas,
  onComprobante,
}: {
  ventas: VentaPOS[];
  onComprobante: (ventaId: string) => void;
}) {
  if (ventas.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Aún no hay ventas registradas en el sistema.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Folio</TableCell>
            <TableCell>Fecha</TableCell>
            <TableCell align="right">Subtotal</TableCell>
            <TableCell align="right">Descuento</TableCell>
            <TableCell align="right">IVA</TableCell>
            <TableCell align="right">Total</TableCell>
            <TableCell align="center">Comprobante</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ventas.map((venta) => (
            <TableRow key={venta.id} hover>
              <TableCell>{venta.folio}</TableCell>
              <TableCell>{formatearFechaConHora(venta.fecha)}</TableCell>
              <TableCell align="right">{formatearMoneda(venta.subtotal)}</TableCell>
              <TableCell align="right">{formatearMoneda(venta.descuento)}</TableCell>
              <TableCell align="right">{formatearMoneda(venta.iva)}</TableCell>
              <TableCell align="right">{formatearMoneda(venta.total)}</TableCell>
              <TableCell align="center">
                <Tooltip title="Ver comprobante PDF">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => onComprobante(venta.id)}
                    aria-label={`Comprobante de la venta ${venta.folio}`}
                  >
                    <PictureAsPdfIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function TablaCortesHistoricos({ cortes }: { cortes: CorteCaja[] }) {
  if (cortes.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Los cortes cerrados en esta sesión aparecerán aquí.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Folio</TableCell>
            <TableCell>Apertura</TableCell>
            <TableCell>Cierre</TableCell>
            <TableCell align="right">Inicial</TableCell>
            <TableCell align="right">Ventas</TableCell>
            <TableCell align="right">Cierre total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cortes.map((corte) => (
            <TableRow key={corte.id} hover>
              <TableCell>{corte.folio}</TableCell>
              <TableCell>{formatearFechaConHora(corte.fechaApertura)}</TableCell>
              <TableCell>{formatearFechaConHora(corte.fechaCierre)}</TableCell>
              <TableCell align="right">{formatearMoneda(corte.montoInicial)}</TableCell>
              <TableCell align="right">{formatearMoneda(corte.ventasTurno)}</TableCell>
              <TableCell align="right">{formatearMoneda(corte.totalCierre)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function RolSelector({ permisos }: { permisos: PermisosContextValue }) {
  return (
    <TextField
      select
      size="small"
      label="Rol activo"
      value={permisos.rol}
      onChange={(event) => permisos.setRol(event.target.value as Rol)}
      sx={{ minWidth: 220 }}
    >
      {permisos.roles.map((rol) => (
        <MenuItem key={rol} value={rol}>
          {ETIQUETAS_ROL[rol]}
        </MenuItem>
      ))}
    </TextField>
  );
}

export function PosCajaPage({
  defaultTab = 0,
  hideTabs = false,
  modo = "venta",
}: PosCajaPageProps) {
  const esCompra = modo === "compra";
  const permisos = usePermisos();
  const toast = useToast();
  const {
    cajaAbierta,
    montoInicial,
    fechaApertura,
    movimientos,
    ventasAcumuladas,
    hidratarDesdeEstado,
    sincronizarApertura,
    sincronizarMovimiento,
    agregarVentaAcumulada,
    finalizarTurno,
  } = useCaja();

  const [activeTab, setActiveTab] = useState<number>(defaultTab === 1 ? 1 : 0);
  const [inventario, setInventario] = useState<ProductoPos[]>([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [descuentoCaptura, setDescuentoCaptura] = useState("0");
  const [descuentoAplicado, setDescuentoAplicado] = useState(0);
  const [montoInicialCaptura, setMontoInicialCaptura] = useState("0");
  const [clientes, setClientes] = useState<Array<{ id: string; nombre: string }>>([]);
  const [clienteId, setClienteId] = useState("");
  const [ventasHistorial, setVentasHistorial] = useState<VentaPOS[]>([]);
  const [cortesCaja, setCortesCaja] = useState<CorteCaja[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [tipoFlujo, setTipoFlujo] = useState<TipoMovimientoCaja>("Ingreso");
  const [conceptoMovimiento, setConceptoMovimiento] = useState("");
  const [montoMovimiento, setMontoMovimiento] = useState("0");
  const [dialogCobroAbierto, setDialogCobroAbierto] = useState(false);
  const [folioCobro, setFolioCobro] = useState("");
  const [totalCobro, setTotalCobro] = useState(0);
  const [dialogCorteAbierto, setDialogCorteAbierto] = useState(false);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    setActiveTab(defaultTab === 1 ? 1 : 0);
  }, [defaultTab]);

  const rolActual = permisos.rol;
  const puedeDescuento = permisos.can("pos:descuento");
  const puedeCancelar = permisos.can("pos:cancelar");
  const puedeAbrirCaja = permisos.can("caja:abrir");
  const puedeRegistrarMovimiento = permisos.can("caja:movimiento");
  const puedeCerrarCaja = permisos.can("caja:cerrar");

  const cargarProductos = useCallback(async () => {
    setCargandoProductos(true);
    try {
      const productos = await listarProductosPos();
      setInventario(productos);
    } catch (error) {
      toast.error(mensajeErrorApi(error, "No se pudo cargar el catálogo de productos."));
    } finally {
      setCargandoProductos(false);
    }
  }, [toast]);

  const cargarClientes = useCallback(async () => {
    try {
      const lista = await listarClientesActivos();
      setClientes(lista.map((cliente) => ({ id: cliente.id, nombre: cliente.nombre })));
      if (lista.length > 0) {
        const primerCliente = lista[0];
        if (primerCliente) {
          setClienteId((actual) => actual || primerCliente.id);
        }
      }
    } catch (error) {
      toast.error(mensajeErrorApi(error, "No se pudo cargar la lista de clientes."));
    }
  }, [toast]);

  const cargarHistorial = useCallback(async () => {
    setCargandoHistorial(true);
    try {
      const ventasApi = await cargarHistorialVentas();
      setVentasHistorial(ventasApi.map((venta) => ventaApiAUi(venta, inventario)));
    } catch (error) {
      toast.error(mensajeErrorApi(error, "No se pudo cargar el historial de ventas."));
    } finally {
      setCargandoHistorial(false);
    }
  }, [inventario, toast]);

  const verComprobante = useCallback(
    async (ventaId: string) => {
      try {
        await abrirComprobanteVenta(ventaId);
      } catch (error) {
        toast.error(mensajeErrorApi(error, "No se pudo abrir el comprobante."));
      }
    },
    [toast],
  );

  useEffect(() => {
    if (permisos.cargandoPermisos || !permisos.usuario) {
      return;
    }
    cargarProductos();
    if (!esCompra) {
      cargarClientes();
      // Restaura el turno de caja que ya estuviera abierto en el backend.
      consultarEstadoCaja()
        .then(hidratarDesdeEstado)
        .catch(() => {
          // Sin estado disponible: la UI arranca con la caja cerrada.
        });
    }
  }, [
    permisos.cargandoPermisos,
    permisos.usuario,
    cargarProductos,
    cargarClientes,
    hidratarDesdeEstado,
    esCompra,
  ]);

  useEffect(() => {
    if (permisos.cargandoPermisos || !permisos.usuario || activeTab !== 1 || esCompra) {
      return;
    }
    cargarHistorial();
  }, [activeTab, esCompra, permisos.cargandoPermisos, permisos.usuario, cargarHistorial]);

  const subtotalCarrito = useMemo(
    () => carrito.reduce((acumulado, item) => acumulado + item.subtotal, 0),
    [carrito],
  );
  const descuentoEfectivo = Math.min(descuentoAplicado, subtotalCarrito);
  const baseGravable = Math.max(subtotalCarrito - descuentoEfectivo, 0);
  const iva = baseGravable * IVA;
  const totalVenta = baseGravable + iva;

  const ingresosManual = useMemo(
    () =>
      movimientos
        .filter((movimiento) => movimiento.tipo === "Ingreso")
        .reduce((total, movimiento) => total + movimiento.monto, 0),
    [movimientos],
  );
  const egresosManual = useMemo(
    () =>
      movimientos
        .filter((movimiento) => movimiento.tipo === "Egreso")
        .reduce((total, movimiento) => total + movimiento.monto, 0),
    [movimientos],
  );
  const ventasTurnoTotal = useMemo(() => ventasAcumuladas, [ventasAcumuladas]);
  const balanceCaja = montoInicial + ventasTurnoTotal + ingresosManual - egresosManual;

  const productosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return inventario.filter((producto) => {
      if (producto.estado !== "Activo") {
        return false;
      }

      if (!termino) {
        return true;
      }

      return (
        producto.clave.toLowerCase().includes(termino) ||
        producto.nombre.toLowerCase().includes(termino)
      );
    });
  }, [busqueda, inventario]);

  const cantidadEnCarrito = (productoId: string) =>
    carrito.find((item) => item.productoId === productoId)?.cantidad ?? 0;

  const agregarProducto = (producto: ProductoPos) => {
    if (!esCompra && !cajaAbierta) {
      toast.info("Primero debes abrir la caja para registrar ventas.");
      setActiveTab(1);
      return;
    }

    const cantidadActual = cantidadEnCarrito(producto.id);
    if (!esCompra && cantidadActual >= producto.existencia) {
      toast.error(`No hay más existencia disponible para ${producto.nombre}.`);
      return;
    }

    setCarrito((carritoActual) => {
      const existente = carritoActual.find((item) => item.productoId === producto.id);

      if (!existente) {
        return [...carritoActual, crearItemCarrito(producto, modo)];
      }

      return carritoActual.map((item) =>
        item.productoId === producto.id
          ? {
              ...item,
              cantidad: item.cantidad + 1,
              subtotal: (item.cantidad + 1) * item.precioUnitario,
            }
          : item,
      );
    });

    toast.exito(`Se agregó ${producto.nombre} al carrito.`);
  };

  const incrementarCantidad = (productoId: string) => {
    const producto = inventario.find((item) => item.id === productoId);
    const partida = carrito.find((item) => item.productoId === productoId);

    if (!producto || !partida) {
      return;
    }

    if (!esCompra && partida.cantidad >= producto.existencia) {
      toast.info(`La existencia máxima de ${producto.nombre} ya fue alcanzada.`);
      return;
    }

    setCarrito((carritoActual) =>
      carritoActual.map((item) =>
        item.productoId === productoId
          ? {
              ...item,
              cantidad: item.cantidad + 1,
              subtotal: (item.cantidad + 1) * item.precioUnitario,
            }
          : item,
      ),
    );
  };

  const decrementarCantidad = (productoId: string) => {
    setCarrito((carritoActual) =>
      carritoActual
        .map((item) =>
          item.productoId === productoId
            ? {
                ...item,
                cantidad: item.cantidad - 1,
                subtotal: (item.cantidad - 1) * item.precioUnitario,
              }
            : item,
        )
        .filter((item) => item.cantidad > 0),
    );
  };

  const eliminarPartida = (productoId: string) => {
    setCarrito((carritoActual) => carritoActual.filter((item) => item.productoId !== productoId));
  };

  const aplicarDescuento = () => {
    if (!puedeDescuento) {
      toast.info("Tu rol no tiene permiso para aplicar descuentos.");
      return;
    }

    const descuento = Number.parseFloat(descuentoCaptura);
    if (Number.isNaN(descuento) || descuento < 0) {
      toast.error("Ingresa un descuento válido.");
      return;
    }

    setDescuentoAplicado(Math.min(descuento, subtotalCarrito));
    toast.exito("Descuento aplicado correctamente.");
  };

  const cancelarVenta = () => {
    if (!puedeCancelar) {
      toast.info("Tu rol no tiene permiso para cancelar ventas.");
      return;
    }

    setCarrito([]);
    setDescuentoAplicado(0);
    setDescuentoCaptura("0");
    toast.info("La venta fue cancelada y el carrito se limpió.");
  };

  const cobrarTransaccion = async () => {
    if (!esCompra && !cajaAbierta) {
      toast.info("La caja debe estar abierta para cobrar una transacción.");
      return;
    }

    if (carrito.length === 0) {
      toast.info(
        esCompra
          ? "Agrega productos al carrito antes de registrar la compra."
          : "Agrega productos al carrito antes de cobrar.",
      );
      return;
    }

    if (!esCompra && !clienteId) {
      toast.error("Selecciona un cliente para registrar la venta.");
      return;
    }

    setProcesando(true);
    try {
      if (esCompra) {
        await crearCompra({
          partidas: carrito.map((item) => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioCompra: item.precioUnitario,
          })),
        });
        setFolioCobro(`COM-${Date.now()}`);
        setTotalCobro(totalVenta);
        toast.exito("La compra fue registrada y el inventario se actualizó.");
      } else {
        const venta = await crearVenta({
          clienteId,
          descuento: descuentoEfectivo,
          partidas: carrito.map((item) => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
          })),
        });
        agregarVentaAcumulada(venta.total);
        setFolioCobro(venta.id);
        setTotalCobro(venta.total);
        toast.exito("La transacción fue cobrada correctamente.");
      }

      setDialogCobroAbierto(true);
      setCarrito([]);
      setDescuentoAplicado(0);
      setDescuentoCaptura("0");
      await cargarProductos();
      if (activeTab === 1) {
        await cargarHistorial();
      }
    } catch (error) {
      toast.error(
        mensajeErrorApi(
          error,
          esCompra
            ? "No se pudo registrar la compra."
            : "No se pudo registrar la venta en el punto de venta.",
        ),
      );
    } finally {
      setProcesando(false);
    }
  };

  const cerrarDialogoCobro = () => {
    setDialogCobroAbierto(false);
    setFolioCobro("");
    setTotalCobro(0);
  };

  const abrirCaja = async () => {
    if (!puedeAbrirCaja) {
      toast.info("Tu rol no tiene permiso para abrir la caja.");
      return;
    }

    const monto = Number.parseFloat(montoInicialCaptura);

    if (Number.isNaN(monto) || monto < 0) {
      toast.error("Ingresa un monto inicial válido para abrir la caja.");
      return;
    }

    setProcesando(true);
    try {
      const caja = await abrirCajaApi(monto);
      sincronizarApertura(caja);
      toast.exito(`Caja abierta con ${formatearMoneda(monto)} de fondo inicial.`);
    } catch (error) {
      toast.error(mensajeErrorApi(error, "No se pudo abrir la caja."));
    } finally {
      setProcesando(false);
    }
  };

  const registrarMovimiento = async () => {
    if (!puedeRegistrarMovimiento) {
      toast.info("Tu rol no tiene permiso para registrar movimientos de caja.");
      return;
    }

    if (!cajaAbierta) {
      toast.info("Primero abre la caja para registrar movimientos.");
      return;
    }

    const monto = Number.parseFloat(montoMovimiento);
    const concepto = conceptoMovimiento.trim();

    if (!concepto) {
      toast.error("Escribe el concepto del movimiento.");
      return;
    }

    if (Number.isNaN(monto) || monto <= 0) {
      toast.error("El monto del movimiento debe ser mayor a cero.");
      return;
    }

    setProcesando(true);
    try {
      const movimiento = await registrarMovimientoCaja({
        tipo: tipoFlujo === "Ingreso" ? "INGRESO" : "EGRESO",
        monto,
        motivo: concepto,
      });
      sincronizarMovimiento(movimiento);
      setConceptoMovimiento("");
      setMontoMovimiento("0");
      toast.exito(
        `Movimiento de caja registrado como ${tipoFlujo === "Ingreso" ? "ingreso" : "egreso"}.`,
      );
    } catch (error) {
      toast.error(mensajeErrorApi(error, "No se pudo registrar el movimiento de caja."));
    } finally {
      setProcesando(false);
    }
  };

  const abrirDialogoCorte = () => {
    if (!puedeCerrarCaja) {
      toast.info("Tu rol no tiene permiso para cerrar la caja.");
      return;
    }

    if (!cajaAbierta) {
      toast.info("La caja debe estar abierta para realizar un corte.");
      return;
    }

    if (carrito.length > 0) {
      toast.info("Cobra o cancela la venta antes de cerrar la caja.");
      return;
    }

    setDialogCorteAbierto(true);
  };

  const cerrarCaja = async () => {
    if (!cajaAbierta) {
      return;
    }

    setProcesando(true);
    try {
      const resumen = await cerrarCajaApi();
      const corte = resumenCorteAUi(resumen, ETIQUETAS_ROL[rolActual]);
      setCortesCaja((cortesActuales) => [corte, ...cortesActuales]);
      finalizarTurno();
      setMontoInicialCaptura("0");
      setDialogCorteAbierto(false);
      toast.exito(`Caja cerrada. Corte final: ${formatearMoneda(resumen.totalCierre)}.`);
      await cargarHistorial();
    } catch (error) {
      toast.error(mensajeErrorApi(error, "No se pudo realizar el corte de caja."));
    } finally {
      setProcesando(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader
        titulo={esCompra ? "Punto de compra" : "Ventas POS + Caja"}
        descripcion={
          esCompra
            ? "Registro de compras a proveedor (precio de compra, suma inventario)"
            : "Punto de venta y gestión de caja"
        }
        acciones={
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            {esCompra ? null : (
              <Chip
                label={cajaAbierta ? "Caja abierta" : "Caja cerrada"}
                color={cajaAbierta ? "success" : "warning"}
                variant="outlined"
              />
            )}
            {hideTabs ? null : <RolSelector permisos={permisos} />}
          </Stack>
        }
      />

      {hideTabs ? null : (
        <Paper variant="outlined" sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, valor: number) => setActiveTab(valor)}
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab
              icon={<PointOfSaleIcon />}
              iconPosition="start"
              value={0}
              label="Punto de Venta (POS)"
            />
            <Tab
              icon={<CreditScoreIcon />}
              iconPosition="start"
              value={1}
              label="Gestión de Caja & Cortes"
            />
          </Tabs>
        </Paper>
      )}

      {activeTab === 0 ? (
        <Stack spacing={3}>
          {!esCompra && !cajaAbierta ? (
            <Alert severity="warning">
              La caja está cerrada. Abre una caja en la pestaña de Caja para habilitar el carrito y
              los cobros.
            </Alert>
          ) : null}

          <Grid container spacing={3} alignItems="stretch">
            <Grid item xs={12} lg={8}>
              <PanelSeccion
                titulo="Productos disponibles"
                descripcion={
                  esCompra
                    ? "Busca y agrega los artículos que entran al inventario por compra."
                    : "Busca por texto o clave y agrega los artículos al carrito de la venta."
                }
              >
                <Stack spacing={2}>
                  <TextField
                    value={busqueda}
                    onChange={(event) => setBusqueda(event.target.value)}
                    placeholder="Buscar por clave o nombre"
                    size="small"
                    fullWidth
                    disabled={cargandoProductos}
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

                  {cargandoProductos ? (
                    <SkeletonTabla filas={6} columnas={6} />
                  ) : (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Clave</TableCell>
                            <TableCell>Nombre</TableCell>
                            <TableCell align="right">Precio</TableCell>
                            <TableCell align="right">Existencia</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell align="center">Acción</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {productosFiltrados.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} align="center">
                                <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                                  No hay productos que coincidan con la búsqueda.
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            productosFiltrados.map((producto) => {
                              const cantidadActual = cantidadEnCarrito(producto.id);
                              const sinExistencia =
                                !esCompra && cantidadActual >= producto.existencia;

                              return (
                                <TableRow key={producto.id} hover>
                                  <TableCell>{producto.clave}</TableCell>
                                  <TableCell>{producto.nombre}</TableCell>
                                  <TableCell align="right">
                                    {formatearMoneda(precioSegunModo(producto, modo))}
                                  </TableCell>
                                  <TableCell align="right">{producto.existencia}</TableCell>
                                  <TableCell>
                                    <EstadoChip activo={producto.estado === "Activo"} />
                                  </TableCell>
                                  <TableCell align="center">
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      startIcon={<AddIcon />}
                                      onClick={() => agregarProducto(producto)}
                                      disabled={
                                        procesando || (!esCompra && !cajaAbierta) || sinExistencia
                                      }
                                    >
                                      Agregar
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Stack>
              </PanelSeccion>
            </Grid>

            <Grid item xs={12} lg={4}>
              <PanelSeccion
                titulo={esCompra ? "Carrito de compra" : "Carrito de venta"}
                descripcion={
                  esCompra
                    ? "Administra cantidades y registra la compra al inventario."
                    : "Administra cantidades, descuento, cobro y cancelación de la venta."
                }
              >
                <Stack spacing={2}>
                  {!esCompra ? (
                    <FormControl fullWidth size="small">
                      <InputLabel id="cliente-pos-label">Cliente</InputLabel>
                      <Select
                        labelId="cliente-pos-label"
                        label="Cliente"
                        value={clienteId}
                        onChange={(event) => setClienteId(event.target.value)}
                        disabled={clientes.length === 0 || procesando}
                      >
                        {clientes.map((cliente) => (
                          <MenuItem key={cliente.id} value={cliente.id}>
                            {cliente.nombre}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : null}

                  {carrito.length === 0 ? (
                    <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        El carrito está vacío.
                      </Typography>
                    </Paper>
                  ) : (
                    carrito.map((item) => (
                      <Paper key={item.productoId} variant="outlined" sx={{ p: 2 }}>
                        <Stack spacing={1.5}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                            gap={2}
                          >
                            <Box>
                              <Typography variant="subtitle2">{item.nombre}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {item.clave} · {formatearMoneda(item.precioUnitario)} c/u
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => eliminarPartida(item.productoId)}
                              aria-label={`Eliminar ${item.nombre}`}
                              disabled={procesando}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>

                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            <Stack direction="row" spacing={1} alignItems="center">
                              <IconButton
                                size="small"
                                onClick={() => decrementarCantidad(item.productoId)}
                                aria-label={`Disminuir ${item.nombre}`}
                                disabled={procesando}
                              >
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                              <Typography
                                variant="body1"
                                sx={{ minWidth: 28, textAlign: "center" }}
                              >
                                {item.cantidad}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => incrementarCantidad(item.productoId)}
                                aria-label={`Incrementar ${item.nombre}`}
                                disabled={procesando || (!esCompra && !cajaAbierta)}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                            <Typography variant="subtitle2">
                              {formatearMoneda(item.subtotal)}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Paper>
                    ))
                  )}

                  <Divider />

                  <Stack spacing={1.25}>
                    <ResumenMonto etiqueta="Subtotal" valor={formatearMoneda(subtotalCarrito)} />
                    {!esCompra ? (
                      <>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                          <TextField
                            label="Descuento manual"
                            type="number"
                            value={descuentoCaptura}
                            onChange={(event) =>
                              setDescuentoCaptura(event.target.value.replace(/[^\d.]/g, ""))
                            }
                            size="small"
                            fullWidth
                            disabled={
                              procesando || !puedeDescuento || carrito.length === 0 || !cajaAbierta
                            }
                            inputProps={{ min: 0, step: "0.01" }}
                          />
                          <Button
                            variant="outlined"
                            onClick={aplicarDescuento}
                            disabled={
                              procesando || !puedeDescuento || carrito.length === 0 || !cajaAbierta
                            }
                          >
                            Aplicar descuento
                          </Button>
                        </Stack>
                        <ResumenMonto
                          etiqueta="Descuento aplicado"
                          valor={formatearMoneda(descuentoEfectivo)}
                        />
                        <ResumenMonto etiqueta="IVA (16%)" valor={formatearMoneda(iva)} />
                      </>
                    ) : null}
                    <ResumenMonto
                      etiqueta={esCompra ? "Total de la compra" : "Total de la venta"}
                      valor={formatearMoneda(totalVenta)}
                      color="#1f3a5f"
                    />
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                    {!esCompra ? (
                      <Button
                        variant="outlined"
                        color="warning"
                        fullWidth
                        onClick={cancelarVenta}
                        disabled={
                          procesando || !puedeCancelar || carrito.length === 0 || !cajaAbierta
                        }
                      >
                        Cancelar venta
                      </Button>
                    ) : null}
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<PointOfSaleIcon />}
                      onClick={() => void cobrarTransaccion()}
                      disabled={procesando || carrito.length === 0 || (!esCompra && !cajaAbierta)}
                    >
                      {procesando
                        ? "Procesando..."
                        : esCompra
                          ? "Registrar compra"
                          : "Cobrar transacción"}
                    </Button>
                  </Stack>
                </Stack>
              </PanelSeccion>
            </Grid>
          </Grid>
        </Stack>
      ) : null}

      {activeTab === 1 ? (
        <Stack spacing={3}>
          <Grid container spacing={3} alignItems="stretch">
            <Grid item xs={12} md={6}>
              <PanelSeccion
                titulo="Apertura de caja"
                descripcion="Ingresa el fondo inicial para habilitar las operaciones del turno."
                acciones={
                  <Chip
                    color={cajaAbierta ? "success" : "default"}
                    label={cajaAbierta ? "Caja operando" : "Pendiente de apertura"}
                    variant="outlined"
                  />
                }
              >
                <Stack spacing={2}>
                  <TextField
                    label="Monto inicial en efectivo"
                    type="number"
                    value={montoInicialCaptura}
                    onChange={(event) =>
                      setMontoInicialCaptura(event.target.value.replace(/[^\d.]/g, ""))
                    }
                    fullWidth
                    inputProps={{ min: 0, step: "0.01" }}
                    disabled={cajaAbierta || procesando}
                  />
                  <Button
                    variant="contained"
                    onClick={() => void abrirCaja()}
                    disabled={cajaAbierta || procesando}
                  >
                    Abrir caja
                  </Button>
                  <Typography variant="body2" color="text.secondary">
                    Fondo registrado: {formatearMoneda(montoInicial)}
                  </Typography>
                  {cajaAbierta && fechaApertura ? (
                    <Typography variant="body2" color="text.secondary">
                      Apertura actual: {formatearFechaConHora(fechaApertura)}
                    </Typography>
                  ) : null}
                </Stack>
              </PanelSeccion>
            </Grid>

            <Grid item xs={12} md={6}>
              <PanelSeccion
                titulo="Flujo manual"
                descripcion="Registra ingresos o egresos adicionales del turno."
              >
                <Stack spacing={2}>
                  <FormControl fullWidth size="small">
                    <Select
                      value={tipoFlujo}
                      onChange={(event) => setTipoFlujo(event.target.value as TipoMovimientoCaja)}
                      disabled={!cajaAbierta || procesando}
                    >
                      <MenuItem value="Ingreso">Ingreso</MenuItem>
                      <MenuItem value="Egreso">Egreso</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="Concepto"
                    value={conceptoMovimiento}
                    onChange={(event) => setConceptoMovimiento(event.target.value)}
                    fullWidth
                    disabled={!cajaAbierta || procesando}
                  />

                  <TextField
                    label="Monto"
                    type="number"
                    value={montoMovimiento}
                    onChange={(event) =>
                      setMontoMovimiento(event.target.value.replace(/[^\d.]/g, ""))
                    }
                    fullWidth
                    inputProps={{ min: 0, step: "0.01" }}
                    disabled={!cajaAbierta || procesando}
                  />

                  <Button
                    variant="outlined"
                    onClick={() => void registrarMovimiento()}
                    disabled={!cajaAbierta || procesando}
                  >
                    Registrar movimiento
                  </Button>

                  <Stack spacing={1}>
                    <ResumenMonto
                      etiqueta="Ingresos manuales"
                      valor={formatearMoneda(ingresosManual)}
                    />
                    <ResumenMonto
                      etiqueta="Egresos manuales"
                      valor={formatearMoneda(egresosManual)}
                    />
                  </Stack>
                </Stack>
              </PanelSeccion>
            </Grid>

            <Grid item xs={12}>
              <PanelSeccion
                titulo="Movimientos del turno"
                descripcion="Registro activo de ingresos y egresos manuales capturados en esta sesión."
              >
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Concepto</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell align="right">Monto</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {movimientos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                              Aún no se registran movimientos manuales.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        movimientos.map((movimiento) => (
                          <TableRow key={movimiento.id} hover>
                            <TableCell>{formatearFechaConHora(movimiento.fecha)}</TableCell>
                            <TableCell>{movimiento.concepto}</TableCell>
                            <TableCell>
                              <Chip
                                label={movimiento.tipo === "Ingreso" ? "Ingreso" : "Egreso"}
                                color={movimiento.tipo === "Ingreso" ? "success" : "warning"}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="right">{formatearMoneda(movimiento.monto)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </PanelSeccion>
            </Grid>

            <Grid item xs={12}>
              <PanelSeccion
                titulo="Cierre con corte"
                descripcion="Balance totalizado del turno: apertura + ventas + ingresos − egresos."
                acciones={
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<AttachMoneyIcon />}
                    onClick={abrirDialogoCorte}
                    disabled={!cajaAbierta || carrito.length > 0 || procesando}
                  >
                    Cierre de caja
                  </Button>
                }
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6} lg={3}>
                    <ResumenMonto etiqueta="Monto inicial" valor={formatearMoneda(montoInicial)} />
                  </Grid>
                  <Grid item xs={12} md={6} lg={3}>
                    <ResumenMonto
                      etiqueta="Ventas POS del turno"
                      valor={formatearMoneda(ventasTurnoTotal)}
                    />
                  </Grid>
                  <Grid item xs={12} md={6} lg={3}>
                    <ResumenMonto
                      etiqueta="Ingresos manuales"
                      valor={formatearMoneda(ingresosManual)}
                    />
                  </Grid>
                  <Grid item xs={12} md={6} lg={3}>
                    <ResumenMonto
                      etiqueta="Egresos manuales"
                      valor={formatearMoneda(egresosManual)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <ResumenMonto
                      etiqueta="Balance total calculado"
                      valor={formatearMoneda(balanceCaja)}
                      color="#1f3a5f"
                    />
                  </Grid>
                </Grid>
              </PanelSeccion>
            </Grid>

            <Grid item xs={12} md={6}>
              <PanelSeccion
                titulo="Historial de ventas previas"
                descripcion="Ventas registradas en el sistema."
              >
                {cargandoHistorial ? (
                  <SkeletonTabla filas={4} columnas={7} />
                ) : (
                  <TablaVentasHistoricas ventas={ventasHistorial} onComprobante={verComprobante} />
                )}
              </PanelSeccion>
            </Grid>

            <Grid item xs={12} md={6}>
              <PanelSeccion
                titulo="Cortes de caja previos"
                descripcion="Cortes realizados en esta sesión."
              >
                <TablaCortesHistoricos cortes={cortesCaja} />
              </PanelSeccion>
            </Grid>
          </Grid>
        </Stack>
      ) : null}

      <Dialog open={dialogCobroAbierto} onClose={cerrarDialogoCobro} fullWidth maxWidth="sm">
        <DialogTitle>
          {esCompra ? "Compra registrada con éxito" : "Transacción cobrada con éxito"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body1">
              {esCompra ? "La compra" : "El cobro"} se registró correctamente con el folio{" "}
              <strong>{folioCobro}</strong>.
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={1}>
                <ResumenMonto
                  etiqueta={esCompra ? "Total de la compra" : "Total cobrado"}
                  valor={formatearMoneda(totalCobro)}
                />
                <Typography variant="body2" color="text.secondary">
                  El carrito se limpió por completo y la operación quedó registrada.
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogoCobro} variant="contained">
            Entendido
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={dialogCorteAbierto}
        onClose={() => setDialogCorteAbierto(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Confirmar cierre de caja</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body1">
              Revisa el balance calculado antes de cerrar el turno. Al confirmar, la caja se cerrará
              y se limpiará el estado operativo del turno.
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={1}>
                <Typography variant="body2">
                  Balance total: {formatearMoneda(balanceCaja)}
                </Typography>
                <Typography variant="body2">
                  Fondo inicial: {formatearMoneda(montoInicial)}
                </Typography>
                <Typography variant="body2">
                  Ventas POS: {formatearMoneda(ventasTurnoTotal)}
                </Typography>
                <Typography variant="body2">
                  Ingresos manuales: {formatearMoneda(ingresosManual)}
                </Typography>
                <Typography variant="body2">
                  Egresos manuales: {formatearMoneda(egresosManual)}
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogCorteAbierto(false)} variant="outlined">
            Cancelar
          </Button>
          <Button
            onClick={() => void cerrarCaja()}
            variant="contained"
            color="secondary"
            disabled={procesando}
          >
            {procesando ? "Cerrando..." : "Cerrar caja"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default function PosCajaModule(props: PosCajaPageProps) {
  return (
    <CajaProvider>
      <PosCajaPage {...props} />
    </CajaProvider>
  );
}
