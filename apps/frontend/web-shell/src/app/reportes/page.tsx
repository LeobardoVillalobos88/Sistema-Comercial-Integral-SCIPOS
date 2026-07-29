"use client";

import Alert from "@mui/material/Alert";
import Container from "@mui/material/Container";
import { usePermisos } from "@scipos/frontend-commons";
import { PanelReportes } from "@scipos/reportes-front";

export default function ReportesPage() {
  const { can } = usePermisos();

  if (!can("reportes:ver")) {
    return (
      <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
        <Alert severity="warning">
          No tienes privilegios para consultar reportes con el rol actual.
        </Alert>
      </Container>
    );
  }

  return <PanelReportes />;
}
