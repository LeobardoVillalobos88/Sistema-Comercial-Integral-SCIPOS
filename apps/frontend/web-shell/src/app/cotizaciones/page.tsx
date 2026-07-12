import { CotizacionesPage, CotizacionesProvider } from "@scipos/cotizaciones-front";

// El módulo se embebe directo aquí (mismo AppShell del host). "Nueva
// cotización" y "Detalle" son modales dentro de CotizacionesPage, así
// siempre se ven la Sidebar y la Topbar.
export default function CotizacionesRoute() {
  return (
    <CotizacionesProvider>
      <CotizacionesPage />
    </CotizacionesProvider>
  );
}
