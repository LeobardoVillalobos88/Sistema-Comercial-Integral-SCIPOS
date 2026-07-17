"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { PermisosProvider, temaScipos } from "@scipos/frontend-commons";
import { ToastProvider } from "@scipos/frontend-commons/feedback";
import { CajaProvider } from "../context/CajaContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <ThemeProvider theme={temaScipos}>
        <CssBaseline />
        <CajaProvider>
          <PermisosProvider rolInicial="SUPERVISOR">
            <ToastProvider>{children}</ToastProvider>
          </PermisosProvider>
        </CajaProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
