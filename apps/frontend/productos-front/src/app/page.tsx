import { CatalogoProductos } from "@/components/CatalogoProductos";
import Container from "@mui/material/Container";

export default function ProductosPage() {
  return (
    <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
      <CatalogoProductos />
    </Container>
  );
}
