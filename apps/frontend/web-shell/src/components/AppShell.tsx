"use client";

import { NAVEGACION } from "@/config/navegacion";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { usePermisos } from "@scipos/frontend-commons";
import { AlertasInventario } from "@scipos/productos-front";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PantallaError } from "./PantallaError";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const ANCHO_MENU_ABIERTO = 248;
const ANCHO_MENU_CERRADO = 80;

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, cargandoPermisos, can, sesionExpirada, apiInalcanzable } = usePermisos();

  const enLogin = pathname === "/login";
  const enPantallaError = pathname.startsWith("/error");
  const sinArmazon = enLogin || enPantallaError;

  useEffect(() => {
    if (!cargandoPermisos && !usuario && !sinArmazon && !sesionExpirada && !apiInalcanzable) {
      router.replace("/login");
    }
  }, [cargandoPermisos, usuario, sinArmazon, sesionExpirada, apiInalcanzable, router]);

  if (sinArmazon) {
    return <Box component="main">{children}</Box>;
  }

  if (apiInalcanzable) {
    return <PantallaError codigo={503} />;
  }

  if (sesionExpirada) {
    return <PantallaError codigo={401} />;
  }

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

  const moduloActual = NAVEGACION.find(
    (item) => pathname === item.ruta || pathname.startsWith(`${item.ruta}/`),
  );
  const sinPrivilegio = Boolean(moduloActual?.privilegio && !can(moduloActual.privilegio));

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
          minWidth: 0,
          bgcolor: "background.default",
          transition: (theme) =>
            theme.transitions.create("width", {
              easing: theme.transitions.easing.easeInOut,
              duration: theme.transitions.duration.enteringScreen,
            }),
        }}
      >
        {/* Compensa la franja fija. Debe medir lo mismo que su Toolbar denso:
            un separador de altura estándar dejaría un hueco muerto arriba. */}
        <Box sx={{ height: { xs: 52, md: 48 } }} />
        {/* Sin relleno propio: cada módulo trae su Container con el suyo, y
            sumarlos dejaba un hueco muerto sobre el rótulo. */}
        <Box>
          {sinPrivilegio ? <PantallaError codigo={403} enMarco /> : children}
          {/* Avisa una vez por sesión de lo vencido y lo agotado. */}
          <AlertasInventario onVerProductos={() => router.push("/productos")} />
        </Box>
      </Box>
    </Box>
  );
}
