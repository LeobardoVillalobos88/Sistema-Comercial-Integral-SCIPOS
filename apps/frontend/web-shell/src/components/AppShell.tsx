"use client";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { usePermisos } from "@scipos/frontend-commons";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const ANCHO_MENU_ABIERTO = 248;
const ANCHO_MENU_CERRADO = 80;

/**
 * Armazón principal de la aplicación: barra superior + menú lateral + área de
 * contenido donde se renderiza cada módulo. Exige sesión: sin usuario redirige
 * al login (el backend valida cada acción de todos modos).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, cargandoPermisos } = usePermisos();

  const enLogin = pathname === "/login";

  useEffect(() => {
    if (!cargandoPermisos && !usuario && !enLogin) {
      router.replace("/login");
    }
  }, [cargandoPermisos, usuario, enLogin, router]);

  // El login se pinta sin armazón.
  if (enLogin) {
    return <Box component="main">{children}</Box>;
  }

  // Mientras se resuelve la sesión (o se redirige al login) no mostramos el
  // armazón protegido, para evitar parpadeos y peticiones sin token.
  if (cargandoPermisos || !usuario) {
    return (
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const anchoActual = sidebarAbierto ? ANCHO_MENU_ABIERTO : ANCHO_MENU_CERRADO;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Topbar anchoMenu={anchoActual} onAbrirMenu={() => setMenuMovilAbierto(true)} />
      <Sidebar
        ancho={anchoActual}
        menuMovilAbierto={menuMovilAbierto}
        onCerrarMenu={() => setMenuMovilAbierto(false)}
        sidebarAbierto={sidebarAbierto}
        onToggleSidebar={() => setSidebarAbierto(!sidebarAbierto)}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${anchoActual}px)` },
          bgcolor: "background.default",
          transition: (theme) =>
            theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
        }}
      >
        {/* Compensa la franja fija. Debe medir lo mismo que su Toolbar denso:
            un separador de altura estándar dejaría un hueco muerto arriba. */}
        <Box sx={{ height: { xs: 52, md: 48 } }} />
        {/* Sin relleno propio: cada módulo trae su Container con el suyo, y
            sumarlos dejaba un hueco muerto sobre el rótulo. */}
        <Box>{children}</Box>
      </Box>
    </Box>
  );
}
