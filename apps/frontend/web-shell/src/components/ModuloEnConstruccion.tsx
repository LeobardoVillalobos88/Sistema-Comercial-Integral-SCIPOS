import ConstructionIcon from "@mui/icons-material/Construction";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { PageHeader } from "@scipos/frontend-commons";

interface ModuloEnConstruccionProps {
  titulo: string;
  responsable: string;
  rama: string;
}

/**
 * Placeholder de un módulo aún no desarrollado. Cada compañero reemplazará el
 * contenido de su página con su microfrontend en su propia rama.
 */
export function ModuloEnConstruccion({ titulo, responsable, rama }: ModuloEnConstruccionProps) {
  return (
    <Box>
      <PageHeader titulo={titulo} />
      <Paper variant="outlined" sx={{ p: 6, textAlign: "center" }}>
        <ConstructionIcon sx={{ fontSize: 56, color: "secondary.main", mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          En construcción
        </Typography>
        <Typography color="text.secondary">
          Responsable: <strong>{responsable}</strong>
        </Typography>
        <Typography color="text.secondary">
          Rama sugerida: <code>{rama}</code>
        </Typography>
      </Paper>
    </Box>
  );
}
