"use client";

import FileDownloadIcon from "@mui/icons-material/FileDownload";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
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
import Typography from "@mui/material/Typography";
import {
  ErrorApi,
  EstadoCotizacionChip,
  PageHeader,
  SkeletonTabla,
  StatCard,
  formatearFechaConHora,
  formatearMoneda,
  llamarApi,
  usePermisos,
} from "@scipos/frontend-commons";
import { useToast } from "@scipos/frontend-commons/feedback";
import { useCallback, useEffect, useState } from "react";

interface ReporteVentas {
  totalVendido: number;
  cantidadVentas: number;
  cantidadCanceladas: number;
  descuentosOtorgados: number;
  ventas: Array<{
    id: string;
    clienteId: string;
    total: number;
    descuento: number;
    estado: "COMPLETA" | "CANCELADA";
    fecha: string;
  }>;
}

interface ReporteCotizaciones {
  borrador: number;
  enviadas: number;
  vendidas: number;
  total: number;
  montoVendido: number;
  cotizaciones: Array<{
    id: string;
    folio: string;
    clienteNombre: string;
    estado: "BORRADOR" | "ENVIADA" | "VENDIDA";
    total: number;
    creadaEn: string;
  }>;
}

interface ReporteProductos {
  totalProductos: number;
  activos: number;
  stockBajo: number;
  valorInventarioCompra: number;
  valorInventarioVenta: number;
  productos: Array<{
    id: string;
    nombre: string;
    tipo: "PRODUCTO" | "SERVICIO";
    precioCompra: number;
    precioVenta: number;
    existencia: number;
    activo: boolean;
  }>;
}

interface ReporteCortes {
  cantidadCortes: number;
  cortes: Array<{
    id: string;
    montoInicial: number;
    montoFinal: number | null;
    fechaApertura: string;
    fechaCierre: string | null;
  }>;
}

interface ReporteUtilidad {
  ingresos: number;
  costoDeVentas: number;
  descuentosOtorgados: number;
  utilidadBruta: number;
  margenPorcentaje: number;
  ventasConsideradas: number;
}

const PESTANAS = ["Ventas", "Cotizaciones", "Inventario", "Cortes", "Utilidad"] as const;

function mensajeError(error: unknown, mensajePorDefecto: string): string {
  return error instanceof ErrorApi ? error.message : mensajePorDefecto;
}

/** Descarga filas como archivo CSV (RF: exportación de información). */
function exportarCsv(nombreArchivo: string, encabezados: string[], filas: string[][]): void {
  const escapar = (valor: string) => `"${valor.replaceAll('"', '""')}"`;
  const lineas = [encabezados, ...filas].map((fila) => fila.map(escapar).join(","));
  const blob = new Blob([`﻿${lineas.join("\r\n")}`], { type: "text/csv;charset=utf-8" });
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(blob);
  enlace.download = nombreArchivo;
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}

/**
 * Panel de reportes comerciales (RF-30, RF-31, RF-33): ventas, cotizaciones,
 * inventario, cortes y utilidad, con filtro por periodo y exportación CSV.
 * El backend exige reportes:ver en cada consulta.
 */
export function PanelReportes() {
  const { can, usuario, cargandoPermisos } = usePermisos();
  const toast = useToast();

  const [pestana, setPestana] = useState(0);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [cargando, setCargando] = useState(false);

  const [ventas, setVentas] = useState<ReporteVentas | null>(null);
  const [cotizaciones, setCotizaciones] = useState<ReporteCotizaciones | null>(null);
  const [productos, setProductos] = useState<ReporteProductos | null>(null);
  const [cortes, setCortes] = useState<ReporteCortes | null>(null);
  const [utilidad, setUtilidad] = useState<ReporteUtilidad | null>(null);

  const rangoQuery = useCallback(() => {
    const parametros = new URLSearchParams();
    if (desde) {
      parametros.set("desde", desde);
    }
    if (hasta) {
      parametros.set("hasta", hasta);
    }
    const cadena = parametros.toString();
    return cadena ? `?${cadena}` : "";
  }, [desde, hasta]);

  const cargarPestana = useCallback(
    async (indice: number) => {
      setCargando(true);
      try {
        if (indice === 0) {
          setVentas(await llamarApi<ReporteVentas>(`/reportes/reportes/ventas${rangoQuery()}`));
        } else if (indice === 1) {
          setCotizaciones(
            await llamarApi<ReporteCotizaciones>(`/reportes/reportes/cotizaciones${rangoQuery()}`),
          );
        } else if (indice === 2) {
          setProductos(await llamarApi<ReporteProductos>("/reportes/reportes/productos"));
        } else if (indice === 3) {
          setCortes(await llamarApi<ReporteCortes>("/reportes/reportes/cortes"));
        } else {
          setUtilidad(
            await llamarApi<ReporteUtilidad>(`/reportes/reportes/utilidad${rangoQuery()}`),
          );
        }
      } catch (error) {
        toast.error(mensajeError(error, "No se pudo cargar el reporte."));
      } finally {
        setCargando(false);
      }
    },
    [rangoQuery, toast],
  );

  useEffect(() => {
    if (cargandoPermisos || !usuario || !can("reportes:ver")) {
      return;
    }
    cargarPestana(pestana);
  }, [cargandoPermisos, usuario, can, pestana, cargarPestana]);

  if (!cargandoPermisos && !can("reportes:ver")) {
    return (
      <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
        <Alert severity="warning">
          No tienes privilegios para consultar reportes con el rol actual.
        </Alert>
      </Container>
    );
  }

  const conFiltroDeFechas = pestana === 0 || pestana === 1 || pestana === 4;

  return (
    <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
      <PageHeader
        titulo="Reportes"
        descripcion="Ventas, cotizaciones, inventario, cortes de caja y utilidad del negocio."
      />

      <Paper variant="outlined" sx={{ mb: 2 }}>
        <Tabs
          value={pestana}
          onChange={(_evento, valor: number) => setPestana(valor)}
          variant="scrollable"
          allowScrollButtonsMobile
        >
          {PESTANAS.map((titulo) => (
            <Tab key={titulo} label={titulo} />
          ))}
        </Tabs>
      </Paper>

      {conFiltroDeFechas && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            label="Desde"
            type="date"
            size="small"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Hasta"
            type="date"
            size="small"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Button variant="outlined" onClick={() => cargarPestana(pestana)}>
            Aplicar periodo
          </Button>
        </Stack>
      )}

      {cargando ? (
        <SkeletonTabla columnas={5} />
      ) : (
        <>
          {pestana === 0 && ventas && (
            <Stack spacing={2}>
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
                }}
              >
                <StatCard
                  titulo="Total vendido"
                  valor={formatearMoneda(ventas.totalVendido)}
                  color="primary"
                />
                <StatCard titulo="Ventas" valor={ventas.cantidadVentas} color="secondary" />
                <StatCard titulo="Canceladas" valor={ventas.cantidadCanceladas} color="primary" />
                <StatCard
                  titulo="Descuentos otorgados"
                  valor={formatearMoneda(ventas.descuentosOtorgados)}
                  color="secondary"
                />
              </Box>
              <Stack direction="row" justifyContent="flex-end">
                <Button
                  startIcon={<FileDownloadIcon />}
                  onClick={() =>
                    exportarCsv(
                      "reporte-ventas.csv",
                      ["Folio", "Cliente", "Estado", "Descuento", "Total", "Fecha"],
                      ventas.ventas.map((venta) => [
                        venta.id,
                        venta.clienteId,
                        venta.estado,
                        String(venta.descuento),
                        String(venta.total),
                        venta.fecha,
                      ]),
                    )
                  }
                >
                  Exportar CSV
                </Button>
              </Stack>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Folio</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="right">Descuento</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell>Fecha</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ventas.ventas.map((venta) => (
                      <TableRow key={venta.id} hover>
                        <TableCell
                          sx={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}
                        >
                          {venta.id}
                        </TableCell>
                        <TableCell>{venta.clienteId}</TableCell>
                        <TableCell>{venta.estado}</TableCell>
                        <TableCell align="right">{formatearMoneda(venta.descuento)}</TableCell>
                        <TableCell align="right">{formatearMoneda(venta.total)}</TableCell>
                        <TableCell>{formatearFechaConHora(venta.fecha)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}

          {pestana === 1 && cotizaciones && (
            <Stack spacing={2}>
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
                }}
              >
                <StatCard titulo="Borradores" valor={cotizaciones.borrador} color="primary" />
                <StatCard titulo="Enviadas" valor={cotizaciones.enviadas} color="secondary" />
                <StatCard titulo="Vendidas" valor={cotizaciones.vendidas} color="success" />
                <StatCard
                  titulo="Monto vendido"
                  valor={formatearMoneda(cotizaciones.montoVendido)}
                  color="success"
                />
              </Box>
              <Stack direction="row" justifyContent="flex-end">
                <Button
                  startIcon={<FileDownloadIcon />}
                  onClick={() =>
                    exportarCsv(
                      "reporte-cotizaciones.csv",
                      ["Folio", "Cliente", "Estado", "Total", "Creada"],
                      cotizaciones.cotizaciones.map((cotizacion) => [
                        cotizacion.folio,
                        cotizacion.clienteNombre,
                        cotizacion.estado,
                        String(cotizacion.total),
                        cotizacion.creadaEn,
                      ]),
                    )
                  }
                >
                  Exportar CSV
                </Button>
              </Stack>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Folio</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell>Creada</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cotizaciones.cotizaciones.map((cotizacion) => (
                      <TableRow key={cotizacion.id} hover>
                        <TableCell>{cotizacion.folio}</TableCell>
                        <TableCell>{cotizacion.clienteNombre}</TableCell>
                        <TableCell>
                          <EstadoCotizacionChip estado={cotizacion.estado} />
                        </TableCell>
                        <TableCell align="right">{formatearMoneda(cotizacion.total)}</TableCell>
                        <TableCell>{formatearFechaConHora(cotizacion.creadaEn)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}

          {pestana === 2 && productos && (
            <Stack spacing={2}>
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
                }}
              >
                <StatCard titulo="Productos activos" valor={productos.activos} color="primary" />
                <StatCard titulo="Stock bajo" valor={productos.stockBajo} color="secondary" />
                <StatCard
                  titulo="Inventario (compra)"
                  valor={formatearMoneda(productos.valorInventarioCompra)}
                  color="primary"
                />
                <StatCard
                  titulo="Inventario (venta)"
                  valor={formatearMoneda(productos.valorInventarioVenta)}
                  color="success"
                />
              </Box>
              <Stack direction="row" justifyContent="flex-end">
                <Button
                  startIcon={<FileDownloadIcon />}
                  onClick={() =>
                    exportarCsv(
                      "reporte-inventario.csv",
                      ["Producto", "Tipo", "Precio compra", "Precio venta", "Existencia", "Activo"],
                      productos.productos.map((producto) => [
                        producto.nombre,
                        producto.tipo,
                        String(producto.precioCompra),
                        String(producto.precioVenta),
                        String(producto.existencia),
                        producto.activo ? "Sí" : "No",
                      ]),
                    )
                  }
                >
                  Exportar CSV
                </Button>
              </Stack>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell align="right">Precio compra</TableCell>
                      <TableCell align="right">Precio venta</TableCell>
                      <TableCell align="right">Existencia</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {productos.productos.map((producto) => (
                      <TableRow key={producto.id} hover>
                        <TableCell>{producto.nombre}</TableCell>
                        <TableCell>{producto.tipo}</TableCell>
                        <TableCell align="right">
                          {formatearMoneda(producto.precioCompra)}
                        </TableCell>
                        <TableCell align="right">{formatearMoneda(producto.precioVenta)}</TableCell>
                        <TableCell align="right">{producto.existencia}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}

          {pestana === 3 && cortes && (
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">
                  {cortes.cantidadCortes} cortes realizados
                </Typography>
                <Button
                  startIcon={<FileDownloadIcon />}
                  onClick={() =>
                    exportarCsv(
                      "reporte-cortes.csv",
                      ["Folio", "Apertura", "Cierre", "Monto inicial", "Monto final"],
                      cortes.cortes.map((corte) => [
                        corte.id,
                        corte.fechaApertura,
                        corte.fechaCierre ?? "",
                        String(corte.montoInicial),
                        String(corte.montoFinal ?? ""),
                      ]),
                    )
                  }
                >
                  Exportar CSV
                </Button>
              </Stack>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Folio</TableCell>
                      <TableCell>Apertura</TableCell>
                      <TableCell>Cierre</TableCell>
                      <TableCell align="right">Monto inicial</TableCell>
                      <TableCell align="right">Monto final</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cortes.cortes.map((corte) => (
                      <TableRow key={corte.id} hover>
                        <TableCell
                          sx={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}
                        >
                          {corte.id}
                        </TableCell>
                        <TableCell>{formatearFechaConHora(corte.fechaApertura)}</TableCell>
                        <TableCell>
                          {corte.fechaCierre ? formatearFechaConHora(corte.fechaCierre) : "—"}
                        </TableCell>
                        <TableCell align="right">{formatearMoneda(corte.montoInicial)}</TableCell>
                        <TableCell align="right">
                          {corte.montoFinal !== null ? formatearMoneda(corte.montoFinal) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}

          {pestana === 4 && utilidad && (
            <Stack spacing={2}>
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
                }}
              >
                <StatCard
                  titulo="Ingresos"
                  valor={formatearMoneda(utilidad.ingresos)}
                  color="primary"
                />
                <StatCard
                  titulo="Costo de ventas"
                  valor={formatearMoneda(utilidad.costoDeVentas)}
                  color="secondary"
                />
                <StatCard
                  titulo="Utilidad bruta"
                  valor={formatearMoneda(utilidad.utilidadBruta)}
                  detalle={`Margen ${utilidad.margenPorcentaje}%`}
                  color="success"
                />
                <StatCard
                  titulo="Ventas consideradas"
                  valor={utilidad.ventasConsideradas}
                  detalle={`Descuentos: ${formatearMoneda(utilidad.descuentosOtorgados)}`}
                  color="secondary"
                />
              </Box>
              <Alert severity="info">
                La utilidad bruta se calcula con el costo actual de cada producto (precio de compra)
                sobre las ventas completadas del periodo, menos los descuentos otorgados.
              </Alert>
            </Stack>
          )}
        </>
      )}
    </Container>
  );
}
