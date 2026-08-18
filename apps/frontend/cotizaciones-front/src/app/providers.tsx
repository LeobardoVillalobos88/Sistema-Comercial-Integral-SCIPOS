"use client";

import { CotizacionesProvider } from "@/store/CotizacionesContext";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { PermisosProvider, temaScipos } from "@scipos/frontend-commons";
import { ToastProvider } from "@scipos/frontend-commons/feedback";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <ThemeProvider theme={temaScipos}>
        <CssBaseline />
        <PermisosProvider rolInicial="VENDEDOR">
          <ToastProvider>
            <CotizacionesProvider>{children}</CotizacionesProvider>
          </ToastProvider>
        </PermisosProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
