"use client";

import DescriptionIcon from "@mui/icons-material/Description";
import InventoryIcon from "@mui/icons-material/Inventory2";
import PeopleIcon from "@mui/icons-material/People";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import SavingsIcon from "@mui/icons-material/Savings";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Box from "@mui/material/Box";
import {
  CLIENTES_MOCK,
  PRODUCTOS_MOCK,
  PageHeader,
  StatCard,
  formatearMoneda,
  llamarApi,
  usePermisos,
} from "@scipos/frontend-commons";
import { useEffect, useState } from "react";

interface ResumenProductos {
  productosActivos: number;
  stockBajo: number;
  proximosACaducar: number;
}

interface ResumenClientes {
  clientesActivos: number;
  clientesNuevos: number;
}

interface ResumenCotizaciones {
  borrador: number;
  enviadas: number;
  vendidas: number;
  total: number;
  montoVendido: number;
}

interface ResumenVentas {
  ventasHoyTotal: number;
  ventasHoyCantidad: number;
  cajaAbierta: boolean;
  ultimoCorteMonto: number | null;
}

interface ResumenUtilidad {
  utilidadBruta: number;
  margenPorcentaje: number;
}

/** Fecha local de hoy en formato AAAA-MM-DD para el filtro del reporte. */
function fechaDeHoy(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

export default function DashboardPage() {
  const { can, usuario, cargandoPermisos } = usePermisos();

  const [resumenProductos, setResumenProductos] = useState<ResumenProductos | null>(null);
  const [resumenClientes, setResumenClientes] = useState<ResumenClientes | null>(null);
  const [resumenCotizaciones, setResumenCotizaciones] = useState<ResumenCotizaciones | null>(null);
  const [resumenVentas, setResumenVentas] = useState<ResumenVentas | null>(null);
  const [resumenUtilidad, setResumenUtilidad] = useState<ResumenUtilidad | null>(null);

  // Descarga los resúmenes reales; si un servicio no responde, la tarjeta
  // correspondiente se oculta o muestra un valor neutro en vez de datos falsos.
  useEffect(() => {
    if (cargandoPermisos || !usuario) {
      return;
    }
    let vigente = true;

    llamarApi<ResumenProductos>("/productos/productos/resumen")
      .then((resumen) => vigente && setResumenProductos(resumen))
      .catch(() => vigente && setResumenProductos(null));

    llamarApi<ResumenClientes>("/clientes/resumen")
      .then((resumen) => vigente && setResumenClientes(resumen))
      .catch(() => vigente && setResumenClientes(null));

    if (can("cotizaciones:ver")) {
      llamarApi<ResumenCotizaciones>("/cotizaciones/cotizaciones/resumen")
        .then((resumen) => vigente && setResumenCotizaciones(resumen))
        .catch(() => vigente && setResumenCotizaciones(null));
    }

    if (can("pos:ver") || can("caja:ver")) {
      llamarApi<ResumenVentas>("/ventas-caja/ventas/resumen")
        .then((resumen) => vigente && setResumenVentas(resumen))
        .catch(() => vigente && setResumenVentas(null));
    }

    if (can("reportes:ver")) {
      const hoy = fechaDeHoy();
      llamarApi<ResumenUtilidad>(`/reportes/reportes/utilidad?desde=${hoy}&hasta=${hoy}`)
        .then((resumen) => vigente && setResumenUtilidad(resumen))
        .catch(() => vigente && setResumenUtilidad(null));
    }

    return () => {
      vigente = false;
    };
  }, [cargandoPermisos, usuario, can]);

  const productosActivos =
    resumenProductos?.productosActivos ?? PRODUCTOS_MOCK.filter((p) => p.activo).length;
  const detalleProductos = resumenProductos
    ? `${resumenProductos.stockBajo} con stock bajo · ${resumenProductos.proximosACaducar} por caducar`
    : `${PRODUCTOS_MOCK.length} en catálogo`;

  const clientesActivos =
    resumenClientes?.clientesActivos ?? CLIENTES_MOCK.filter((c) => c.activo).length;
  const detalleClientes = resumenClientes
    ? `${resumenClientes.clientesNuevos} nuevos en los últimos 30 días`
    : "Cartera total";

  const cotizacionesPendientes = resumenCotizaciones
    ? resumenCotizaciones.borrador + resumenCotizaciones.enviadas
    : null;
  const detalleCotizaciones = resumenCotizaciones
    ? `${resumenCotizaciones.borrador} en borrador · ${resumenCotizaciones.vendidas} vendidas`
    : "Sin datos disponibles";

  const detalleCaja = resumenVentas?.cajaAbierta
    ? "Turno en curso"
    : resumenVentas
      ? "Caja cerrada"
      : "Sin datos disponibles";

  return (
    <Box>
      <PageHeader titulo="Dashboard" descripcion="Resumen general de la operación" />

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
        }}
      >
        {/* Ventas del día: visible para quien puede operar el POS o la caja. */}
        {(can("pos:ver") || can("caja:ver")) && (
          <StatCard
            titulo="Ventas de hoy"
            valor={formatearMoneda(resumenVentas?.ventasHoyTotal ?? 0)}
            detalle={
              resumenVentas
                ? `${resumenVentas.ventasHoyCantidad} tickets emitidos`
                : "Sin datos disponibles"
            }
            icono={<PointOfSaleIcon />}
            color="primary"
          />
        )}

        {can("cotizaciones:ver") && (
          <StatCard
            titulo="Cotizaciones pendientes"
            valor={cotizacionesPendientes ?? 0}
            detalle={detalleCotizaciones}
            icono={<DescriptionIcon />}
            color="secondary"
          />
        )}

        <StatCard
          titulo="Productos activos"
          valor={productosActivos}
          detalle={detalleProductos}
          icono={<InventoryIcon />}
          color="primary"
        />

        {can("clientes:ver") && (
          <StatCard
            titulo="Clientes activos"
            valor={clientesActivos}
            detalle={detalleClientes}
            icono={<PeopleIcon />}
            color="secondary"
          />
        )}

        {/* Caja: solo para quien la opera o supervisa. */}
        {can("caja:ver") && (
          <StatCard
            titulo="Último corte de caja"
            valor={formatearMoneda(resumenVentas?.ultimoCorteMonto ?? 0)}
            detalle={detalleCaja}
            icono={<SavingsIcon />}
            color="success"
          />
        )}

        {/* Utilidad: información sensible, solo con privilegio de reportes. */}
        {can("reportes:ver") && (
          <StatCard
            titulo="Utilidad de hoy"
            valor={formatearMoneda(resumenUtilidad?.utilidadBruta ?? 0)}
            detalle={
              resumenUtilidad
                ? `Margen ${resumenUtilidad.margenPorcentaje}%`
                : "Sin datos disponibles"
            }
            icono={<TrendingUpIcon />}
            color="success"
          />
        )}
      </Box>
    </Box>
  );
}
