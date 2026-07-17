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

const VENTAS_HOY = 12450.5;
const COTIZACIONES_ACTIVAS = 8;
const UTILIDAD_HOY = 3180.75;
const ULTIMO_CORTE = 9870.0;

interface ResumenProductos {
  productosActivos: number;
  stockBajo: number;
  proximosACaducar: number;
}

interface ResumenClientes {
  clientesActivos: number;
  clientesNuevos: number;
}

export default function DashboardPage() {
  const { can, usuario, cargandoPermisos } = usePermisos();

  const [resumenProductos, setResumenProductos] = useState<ResumenProductos | null>(null);
  const [resumenClientes, setResumenClientes] = useState<ResumenClientes | null>(null);

  // Descarga los resúmenes reales; si un servicio no responde, la tarjeta
  // conserva el valor de respaldo calculado con los datos locales.
  useEffect(() => {
    if (cargandoPermisos || !usuario) {
      return;
    }
    let vigente = true;
    llamarApi<ResumenProductos>("/productos/productos/resumen")
      .then((resumen) => {
        if (vigente) {
          setResumenProductos(resumen);
        }
      })
      .catch(() => {
        if (vigente) {
          setResumenProductos(null);
        }
      });
    llamarApi<ResumenClientes>("/clientes/resumen")
      .then((resumen) => {
        if (vigente) {
          setResumenClientes(resumen);
        }
      })
      .catch(() => {
        if (vigente) {
          setResumenClientes(null);
        }
      });
    return () => {
      vigente = false;
    };
  }, [cargandoPermisos, usuario]);

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
            valor={formatearMoneda(VENTAS_HOY)}
            detalle="12 tickets emitidos"
            icono={<PointOfSaleIcon />}
            color="primary"
          />
        )}

        {can("cotizaciones:ver") && (
          <StatCard
            titulo="Cotizaciones activas"
            valor={COTIZACIONES_ACTIVAS}
            detalle="2 por vencer"
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
            valor={formatearMoneda(ULTIMO_CORTE)}
            detalle="Turno anterior"
            icono={<SavingsIcon />}
            color="success"
          />
        )}

        {/* Utilidad: información sensible, solo con privilegio de reportes. */}
        {can("reportes:ver") && (
          <StatCard
            titulo="Utilidad de hoy"
            valor={formatearMoneda(UTILIDAD_HOY)}
            detalle="Margen estimado"
            icono={<TrendingUpIcon />}
            color="success"
          />
        )}
      </Box>
    </Box>
  );
}
