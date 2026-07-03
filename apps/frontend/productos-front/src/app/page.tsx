import { CatalogoProductos } from "@/components/CatalogoProductos";
import Container from "@mui/material/Container";

export default function ProductosPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <CatalogoProductos />
    </Container>
  );
}
