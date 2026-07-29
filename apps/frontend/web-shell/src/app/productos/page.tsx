import Container from "@mui/material/Container";
import { CatalogoProductos } from "@scipos/productos-front";

export default function ProductosPage() {
  return (
    <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
      <CatalogoProductos />
    </Container>
  );
}
