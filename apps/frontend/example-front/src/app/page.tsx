"use client";

import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import {
  type Columna,
  EstadoChip,
  PRODUCTOS_MOCK,
  PageHeader,
  Permiso,
  type Producto,
  SearchableTable,
  formatearMoneda,
} from "@scipos/frontend-commons";

// Definición de columnas para la tabla (patrón a seguir en tu módulo).
const columnas: Columna<Producto>[] = [
  { clave: "lote", titulo: "Lote", render: (p) => p.lote },
  { clave: "nombre", titulo: "Nombre", render: (p) => p.nombre },
  {
    clave: "precio",
    titulo: "Precio venta",
    align: "right",
    render: (p) => formatearMoneda(p.precioVenta),
  },
  { clave: "existencia", titulo: "Existencia", align: "right", render: (p) => p.existencia },
  { clave: "estado", titulo: "Estado", render: (p) => <EstadoChip activo={p.activo} /> },
];

export default function EjemploPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader
        titulo="Microfrontend de ejemplo"
        descripcion="Plantilla: así se usa el Design System (commons) en tu módulo."
        acciones={
          // El botón solo aparece si el rol activo tiene el privilegio.
          <Permiso requiere="productos:crear">
            <Button variant="contained" startIcon={<AddIcon />}>
              Nuevo producto
            </Button>
          </Permiso>
        }
      />
      <Box>
        <SearchableTable
          filas={PRODUCTOS_MOCK}
          columnas={columnas}
          textoBusqueda={(p) => `${p.lote} ${p.nombre}`}
          placeholderBusqueda="Buscar producto..."
        />
      </Box>
    </Container>
  );
}
