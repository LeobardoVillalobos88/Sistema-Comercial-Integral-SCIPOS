"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { PermisosProvider, temaScipos } from "@scipos/frontend-commons";
import { ToastProvider } from "@scipos/frontend-commons/feedback";

// Cada microfrontend, al correr solo, monta sus propios proveedores.
// Cuando se integra en el web-shell, estos proveedores los aporta el host.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <ThemeProvider theme={temaScipos}>
        <CssBaseline />
        <PermisosProvider rolInicial="SUPERVISOR">
          <ToastProvider>{children}</ToastProvider>
        </PermisosProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
