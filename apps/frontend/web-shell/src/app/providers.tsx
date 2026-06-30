"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { PermisosProvider, temaScipos } from "@scipos/frontend-commons";

/**
 * Proveedores globales del shell: cache de Emotion (SSR de Next), tema MUI y
 * el contexto de permisos.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <ThemeProvider theme={temaScipos}>
        <CssBaseline />
        <PermisosProvider rolInicial="ADMINISTRADOR">{children}</PermisosProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
