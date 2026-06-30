import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { PageHeader } from "@scipos/frontend-commons";

export default function DashboardPage() {
  return (
    <Box>
      <PageHeader titulo="Dashboard" descripcion="Resumen general de la operación" />
      <Paper variant="outlined" sx={{ p: 6, textAlign: "center" }}>
        <Typography variant="h6" gutterBottom>
          Bienvenido a SCIPOS
        </Typography>
        <Typography color="text.secondary">
          El tablero de métricas se integra en la rama feature/dashboard-inicial.
        </Typography>
      </Paper>
    </Box>
  );
}
