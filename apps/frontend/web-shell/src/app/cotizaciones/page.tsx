import { CotizacionesPage, CotizacionesProvider } from "@scipos/cotizaciones-front";

// El módulo de Ángel se embebe directo aquí (mismo AppShell del host), en
// vez de redirigir a un puerto aparte. "Nueva cotización" y "Detalle" son
// modales dentro de CotizacionesPage, así siempre se ve la Sidebar/Topbar.
export default function CotizacionesRoute() {
  return (
    <CotizacionesProvider>
      <CotizacionesPage />
    </CotizacionesProvider>
  );
}
