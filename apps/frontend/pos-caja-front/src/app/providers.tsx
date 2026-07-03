"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { PermisosProvider, temaScipos } from "@scipos/frontend-commons";
import { CajaProvider } from "../context/CajaContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <ThemeProvider theme={temaScipos}>
        <CssBaseline />
        <CajaProvider>
          <PermisosProvider rolInicial="SUPERVISOR">{children}</PermisosProvider>
        </CajaProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
