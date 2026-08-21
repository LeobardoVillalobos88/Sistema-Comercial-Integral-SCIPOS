"use client";

import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { SkeletonTabla, formatearFechaConHora, formatearMoneda } from "@scipos/frontend-commons";

import type { TipoMovimientoCaja } from "../context/CajaContext";
import type { CorteCaja, MovimientoCaja, VentaPOS } from "../types/pos";
import { PanelSeccion } from "./PanelSeccion";
import { ResumenMonto } from "./ResumenMonto";

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

export interface PanelCajaProps {
  /** Estado del turno. */
  cajaAbierta: boolean;
  montoInicial: number;
  fechaApertura: string | null;
  movimientos: MovimientoCaja[];
  procesando: boolean;
  /** Captura del fondo inicial. */
  montoInicialCaptura: string;
  onMontoInicialCapturaChange: (valor: string) => void;
  onAbrirCaja: () => void;
  /** Captura de un movimiento manual. */
  tipoFlujo: TipoMovimientoCaja;
  onTipoFlujoChange: (tipo: TipoMovimientoCaja) => void;
  conceptoMovimiento: string;
  onConceptoMovimientoChange: (concepto: string) => void;
  montoMovimiento: string;
  onMontoMovimientoChange: (monto: string) => void;
  onRegistrarMovimiento: () => void;
  /** Totales del turno. */
  ingresosManual: number;
  egresosManual: number;
  ventasTurnoTotal: number;
  balanceCaja: number;
  /** El corte se bloquea mientras haya una venta a medias. */
  hayVentaEnCurso: boolean;
  onAbrirDialogoCorte: () => void;
  /** Historial. */
  cargandoHistorial: boolean;
  ventasHistorial: VentaPOS[];
  cortesCaja: CorteCaja[];
  onVerComprobante: (ventaId: string) => void;
}

/**
 * Pestaña de caja: apertura del turno, movimientos manuales, corte y los
 * historiales de ventas y cortes. Recibe el estado ya resuelto; no consulta la
 * API por su cuenta.
 */
export function PanelCaja({
  cajaAbierta,
  montoInicial,
  fechaApertura,
  movimientos,
  procesando,
  montoInicialCaptura,
  onMontoInicialCapturaChange,
  onAbrirCaja,
  tipoFlujo,
  onTipoFlujoChange,
  conceptoMovimiento,
  onConceptoMovimientoChange,
  montoMovimiento,
  onMontoMovimientoChange,
  onRegistrarMovimiento,
  ingresosManual,
  egresosManual,
  ventasTurnoTotal,
  balanceCaja,
  hayVentaEnCurso,
  onAbrirDialogoCorte,
  cargandoHistorial,
  ventasHistorial,
  cortesCaja,
  onVerComprobante,
}: PanelCajaProps) {
  return (
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
                  onMontoInicialCapturaChange(event.target.value.replace(/[^\d.]/g, ""))
                }
                fullWidth
                inputProps={{ min: 0, step: "0.01" }}
                disabled={cajaAbierta || procesando}
              />
              <Button
                variant="contained"
                onClick={onAbrirCaja}
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
                  onChange={(event) => onTipoFlujoChange(event.target.value as TipoMovimientoCaja)}
                  disabled={!cajaAbierta || procesando}
                >
                  <MenuItem value="Ingreso">Ingreso</MenuItem>
                  <MenuItem value="Egreso">Egreso</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Concepto"
                value={conceptoMovimiento}
                onChange={(event) => onConceptoMovimientoChange(event.target.value)}
                fullWidth
                disabled={!cajaAbierta || procesando}
              />

              <TextField
                label="Monto"
                type="number"
                value={montoMovimiento}
                onChange={(event) =>
                  onMontoMovimientoChange(event.target.value.replace(/[^\d.]/g, ""))
                }
                fullWidth
                inputProps={{ min: 0, step: "0.01" }}
                disabled={!cajaAbierta || procesando}
              />

              <Button
                variant="outlined"
                onClick={onRegistrarMovimiento}
                disabled={!cajaAbierta || procesando}
              >
                Registrar movimiento
              </Button>

              <Stack spacing={1}>
                <ResumenMonto
                  etiqueta="Ingresos manuales"
                  valor={formatearMoneda(ingresosManual)}
                />
                <ResumenMonto etiqueta="Egresos manuales" valor={formatearMoneda(egresosManual)} />
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
                onClick={onAbrirDialogoCorte}
                disabled={!cajaAbierta || hayVentaEnCurso || procesando}
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
                <ResumenMonto etiqueta="Egresos manuales" valor={formatearMoneda(egresosManual)} />
              </Grid>
              <Grid item xs={12}>
                <ResumenMonto
                  etiqueta="Balance total calculado"
                  valor={formatearMoneda(balanceCaja)}
                  color="primary.main"
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
              <TablaVentasHistoricas ventas={ventasHistorial} onComprobante={onVerComprobante} />
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
  );
}
