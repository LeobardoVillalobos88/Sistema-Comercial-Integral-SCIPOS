import { CotizacionesPage, CotizacionesProvider } from "@scipos/cotizaciones-front";

export default function CotizacionesRoute() {
  return (
    <CotizacionesProvider>
      <CotizacionesPage />
    </CotizacionesProvider>
  );
}
