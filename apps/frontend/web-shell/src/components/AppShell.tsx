"use client";

import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const ANCHO_MENU = 248;

/**
 * Armazón principal de la aplicación: barra superior + menú lateral + área de
 * contenido donde se renderiza cada módulo.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Topbar anchoMenu={ANCHO_MENU} onAbrirMenu={() => setMenuMovilAbierto(true)} />
      <Sidebar
        ancho={ANCHO_MENU}
        menuMovilAbierto={menuMovilAbierto}
        onCerrarMenu={() => setMenuMovilAbierto(false)}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${ANCHO_MENU}px)` },
          bgcolor: "background.default",
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, md: 4 } }}>{children}</Box>
      </Box>
    </Box>
  );
}
