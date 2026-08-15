"use client";

import Alert from "@mui/material/Alert";
import Container from "@mui/material/Container";
import { usePermisos } from "@scipos/frontend-commons";
import PosCajaPage from "@scipos/pos-caja-front";

export default function ComprasPage() {
  const { can } = usePermisos();

  if (!can("compras:ver")) {
    return (
      <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
        <Alert severity="warning">
          No tienes privilegios para acceder al punto de compra con el rol actual.
        </Alert>
      </Container>
    );
  }

  return <PosCajaPage modo="compra" defaultTab={0} hideTabs />;
}
