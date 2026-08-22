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

/**
 * Armazón principal de la aplicación: barra superior + menú lateral + área de
 * contenido donde se renderiza cada módulo. Exige sesión: sin usuario redirige
 * al login (el backend valida cada acción de todos modos).
 *
 * También es donde se decide qué pantalla de error toca: sesión vencida,
 * servidor caído o módulo sin privilegio.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, cargandoPermisos, can, sesionExpirada, apiInalcanzable } = usePermisos();

  const enLogin = pathname === "/login";
  // Las pantallas de error se pintan solas. Si pasaran por el armazón, un 401
  // dispararía la redirección al login antes de que alguien alcance a leerlo.
  const enPantallaError = pathname.startsWith("/error");
  const sinArmazon = enLogin || enPantallaError;

  useEffect(() => {
    // Sin sesión se va al login, salvo que haya un error que explicar primero.
    if (!cargandoPermisos && !usuario && !sinArmazon && !sesionExpirada && !apiInalcanzable) {
      router.replace("/login");
    }
  }, [cargandoPermisos, usuario, sinArmazon, sesionExpirada, apiInalcanzable, router]);

  if (sinArmazon) {
    return <Box component="main">{children}</Box>;
  }

  // El servidor no contestó al restaurar la sesión: los tokens siguen guardados,
  // así que reintentar puede bastar.
  if (apiInalcanzable) {
    return <PantallaError codigo={503} />;
  }

  // La sesión murió a media faena. Se explica, en vez de rebotar en silencio.
  if (sesionExpirada) {
    return <PantallaError codigo={401} />;
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

  // Entrar por dirección directa a un módulo ajeno: el menú ya lo esconde, pero
  // la URL no lo impedía. El backend rechaza la acción de todos modos; esto es
  // para que el usuario lea por qué y no se tope con una pantalla vacía.
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
        anchoMovil={ANCHO_MENU_ABIERTO}
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
          // Un ítem flex arranca con min-width:auto, o sea que se niega a
          // encogerse por debajo del ancho de su contenido. Con una tabla
          // ancha adentro, el área crecía hasta medir lo que la tabla y
          // arrastraba consigo a toda la página: en un teléfono, 922px de
          // contenido dentro de una pantalla de 375. El TableContainer nunca
          // llegaba a desplazarse porque su padre le cedía el espacio.
          // Ponerlo en cero devuelve el desplazamiento a la tabla, que es
          // donde corresponde.
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
