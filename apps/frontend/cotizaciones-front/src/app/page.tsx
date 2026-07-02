"use client";

import { EstadoCotizacionChip } from "@/components/EstadoCotizacionChip";
import { useCotizaciones } from "@/store/CotizacionesContext";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import {
  CLIENTES_MOCK,
  type Columna,
  type Cotizacion,
  type EstadoCotizacion,
  PageHeader,
  Permiso,
  SearchableTable,
  formatearFecha,
  formatearMoneda,
  usePermisos,
} from "@scipos/frontend-commons";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const OPCIONES_ESTADO: { valor: EstadoCotizacion | "TODOS"; etiqueta: string }[] = [
  { valor: "TODOS", etiqueta: "Todos los estados" },
  { valor: "BORRADOR", etiqueta: "Borrador" },
  { valor: "ENVIADA", etiqueta: "Enviada" },
  { valor: "CONVERTIDA", etiqueta: "Convertida" },
];

function nombreCliente(clienteId: string): string {
  return CLIENTES_MOCK.find((c) => c.id === clienteId)?.nombre ?? "Cliente no encontrado";
}

function totalCotizacion(cotizacion: Cotizacion): number {
  return cotizacion.partidas.reduce(
    (acc, partida) => acc + partida.cantidad * partida.precioUnitario,
    0,
  );
}

export default function CotizacionesPage() {
  const router = useRouter();
  const { can } = usePermisos();
  const { cotizaciones } = useCotizaciones();
  const [clienteId, setClienteId] = useState("TODOS");
  const [estado, setEstado] = useState<EstadoCotizacion | "TODOS">("TODOS");

  const filas = useMemo(() => {
    return cotizaciones.filter((c) => {
      if (clienteId !== "TODOS" && c.clienteId !== clienteId) return false;
      if (estado !== "TODOS" && c.estado !== estado) return false;
      return true;
    });
  }, [cotizaciones, clienteId, estado]);

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
      render: (c) => <EstadoCotizacionChip estado={c.estado} />,
    },
    {
      clave: "acciones",
      titulo: "",
      align: "right",
      render: (c) => (
        <IconButton size="small" onClick={() => router.push(`/${c.id}`)} aria-label="Ver detalle">
          <VisibilityIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  if (!can("cotizaciones:ver")) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <PageHeader titulo="Cotizaciones" />
        <Alert severity="warning">
          No tienes privilegios para ver cotizaciones con el rol actual.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader
        titulo="Cotizaciones"
        descripcion="Historial de cotizaciones y su conversión a venta."
        acciones={
          <Permiso requiere="cotizaciones:crear">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push("/nueva-cotizacion")}
            >
              Nueva cotización
            </Button>
          </Permiso>
        }
      />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          select
          size="small"
          label="Cliente"
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          sx={{ minWidth: 240 }}
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
          sx={{ minWidth: 200 }}
        >
          {OPCIONES_ESTADO.map((op) => (
            <MenuItem key={op.valor} value={op.valor}>
              {op.etiqueta}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      <Box>
        <SearchableTable
          filas={filas}
          columnas={columnas}
          textoBusqueda={(c) => `${c.folio} ${nombreCliente(c.clienteId)}`}
          placeholderBusqueda="Buscar por folio o cliente..."
          mensajeVacio="No hay cotizaciones que coincidan con los filtros."
        />
      </Box>
    </Container>
  );
}
