"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { PermisosProvider, temaScipos } from "@scipos/frontend-commons";

// Cuando este módulo corre solo (`pnpm --filter @scipos/productos-front dev`)
// monta sus propios proveedores. Al integrarse en el web-shell, el host los aporta.
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
