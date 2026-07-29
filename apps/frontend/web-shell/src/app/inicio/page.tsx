"use client";

import InventoryIcon from "@mui/icons-material/Inventory2";
import SellIcon from "@mui/icons-material/Sell";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { BarChart } from "@mui/x-charts/BarChart";
import { PRODUCTOS_MOCK, PageHeader, StatCard, formatearMoneda } from "@scipos/frontend-commons";

// Colores del par categórico compra/venta (validados para daltonismo).
const COLOR_COMPRA = "#2f6f9f";
const COLOR_VENTA = "#e08e0b";

const productos = PRODUCTOS_MOCK.filter((p) => p.tipo === "PRODUCTO");

// Resumen del negocio a partir del catálogo.
const productosActivos = PRODUCTOS_MOCK.filter((p) => p.activo).length;
const valorCompra = productos.reduce((acc, p) => acc + p.precioCompra * p.existencia, 0);
const valorVenta = productos.reduce((acc, p) => acc + p.precioVenta * p.existencia, 0);
const gananciaPotencial = valorVenta - valorCompra;
const margenPromedio =
  productos.length > 0
    ? productos.reduce((acc, p) => acc + (p.precioVenta - p.precioCompra) / p.precioVenta, 0) /
      productos.length
    : 0;

// Datos para las gráficas: los 8 productos con mayor precio de venta.
const productosGrafica = [...productos].sort((a, b) => b.precioVenta - a.precioVenta).slice(0, 8);
const etiquetas = productosGrafica.map((p) => p.nombre);
const datosCompra = productosGrafica.map((p) => p.precioCompra);
const datosVenta = productosGrafica.map((p) => p.precioVenta);
const datosGanancia = productosGrafica.map((p) =>
  Number((p.precioVenta - p.precioCompra).toFixed(2)),
);

function PanelGrafica({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {titulo}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}

export default function InicioPage() {
  return (
    <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
      <PageHeader
        titulo="Inicio"
        descripcion="Panorama general del negocio: inventario, precios de compra y de venta."
      />

      {/* Bienvenida */}
      <Card
        variant="outlined"
        sx={{ mb: 3, bgcolor: "primary.main", color: "primary.contrastText" }}
      >
        <CardContent>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Bienvenido a SCIPOS
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, maxWidth: 720 }}>
            Sistema Comercial Integral: administra tu catálogo, clientes, cotizaciones, ventas y
            caja desde un solo lugar. Aquí tienes un resumen del estado actual de tu negocio.
          </Typography>
        </CardContent>
      </Card>

      {/* Tarjetas de resumen */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          mb: 3,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
        }}
      >
        <StatCard
          titulo="Productos activos"
          valor={productosActivos}
          detalle={`${PRODUCTOS_MOCK.length} en catálogo`}
          icono={<InventoryIcon />}
          color="primary"
        />
        <StatCard
          titulo="Inventario a precio de compra"
          valor={formatearMoneda(valorCompra)}
          detalle="Costo del stock actual"
          icono={<ShoppingCartIcon />}
          color="primary"
        />
        <StatCard
          titulo="Inventario a precio de venta"
          valor={formatearMoneda(valorVenta)}
          detalle="Valor potencial de venta"
          icono={<SellIcon />}
          color="secondary"
        />
        <StatCard
          titulo="Ganancia potencial"
          valor={formatearMoneda(gananciaPotencial)}
          detalle={`Margen promedio ${(margenPromedio * 100).toFixed(0)}%`}
          icono={<TrendingUpIcon />}
          color="success"
        />
      </Box>

      {/* Gráficas */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", lg: "3fr 2fr" },
        }}
      >
        <PanelGrafica titulo="Precio de compra vs. precio de venta (por producto)">
          <BarChart
            height={340}
            xAxis={[
              {
                scaleType: "band",
                data: etiquetas,
                tickLabelStyle: { angle: -35, textAnchor: "end", fontSize: 11 },
              },
            ]}
            series={[
              { data: datosCompra, label: "Precio de compra", color: COLOR_COMPRA },
              { data: datosVenta, label: "Precio de venta", color: COLOR_VENTA },
            ]}
            margin={{ bottom: 90, left: 60, right: 16, top: 16 }}
          />
        </PanelGrafica>

        <PanelGrafica titulo="Ganancia por unidad (venta − compra)">
          <BarChart
            height={340}
            xAxis={[
              {
                scaleType: "band",
                data: etiquetas,
                tickLabelStyle: { angle: -35, textAnchor: "end", fontSize: 11 },
              },
            ]}
            series={[{ data: datosGanancia, label: "Ganancia por unidad", color: COLOR_COMPRA }]}
            margin={{ bottom: 90, left: 60, right: 16, top: 16 }}
          />
        </PanelGrafica>
      </Box>
    </Container>
  );
}
