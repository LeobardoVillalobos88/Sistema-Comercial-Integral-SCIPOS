"use client";

import { NAVEGACION } from "@/config/navegacion";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DescriptionIcon from "@mui/icons-material/Description";
import InsightsIcon from "@mui/icons-material/Insights";
import InventoryIcon from "@mui/icons-material/Inventory2";
import LogoutIcon from "@mui/icons-material/Logout";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import PeopleIcon from "@mui/icons-material/People";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import SavingsIcon from "@mui/icons-material/Savings";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { ESMALTE, SOBRE_ESMALTE, sombraRotulo, usePermisos } from "@scipos/frontend-commons";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONOS = {
  insights: InsightsIcon,
  dashboard: DashboardIcon,
  inventory: InventoryIcon,
  people: PeopleIcon,
  description: DescriptionIcon,
  point_of_sale: PointOfSaleIcon,
  shopping_cart: ShoppingCartIcon,
  savings: SavingsIcon,
  assessment: AssessmentIcon,
  manage_accounts: ManageAccountsIcon,
} as const;

interface SidebarProps {
  ancho: number;
  menuMovilAbierto: boolean;
  onCerrarMenu: () => void;
  sidebarAbierto?: boolean;
  onToggleSidebar?: () => void;
}

function Contenido({
  onNavegar,
  sidebarAbierto = true,
  onToggleSidebar,
}: {
  onNavegar?: () => void;
  sidebarAbierto?: boolean;
  onToggleSidebar?: () => void;
}) {
  const pathname = usePathname();
  const { can, cerrarSesion } = usePermisos();

  // Solo se muestran los módulos cuyo privilegio tiene el rol actual.
  const itemsVisibles = NAVEGACION.filter((item) => !item.privilegio || can(item.privilegio));

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        position: "relative",
        // Campo de esmalte plano: el muro es de un solo color, sin degradado.
        bgcolor: ESMALTE.azul,
        color: SOBRE_ESMALTE.texto,
      }}
    >
      {/* Botón flotante para expandir/colapsar (solo visible en escritorio si se pasa la función) */}
      {onToggleSidebar && (
        <IconButton
          onClick={onToggleSidebar}
          size="small"
          sx={{
            position: "absolute",
            top: "50%",
            transform: "translateY(-50%)",
            right: -14,
            bgcolor: SOBRE_ESMALTE.texto,
            color: ESMALTE.azul,
            border: 1,
            borderColor: "rgba(0,0,0,0.1)",
            zIndex: 10,
            "&:hover": { bgcolor: "grey.100" },
            display: { xs: "none", md: "flex" },
          }}
        >
          {sidebarAbierto ? (
            <ChevronLeftIcon fontSize="small" />
          ) : (
            <ChevronRightIcon fontSize="small" />
          )}
        </IconButton>
      )}

      {/* El sistema se identifica como SCIPOS; LOBOSOFT firma al pie. */}
      <Box
        sx={{
          px: 2,
          py: 2.25,
          minHeight: 76,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: sidebarAbierto ? "flex-start" : "center",
          borderBottom: `1px solid ${SOBRE_ESMALTE.divisor}`,
        }}
      >
        <Typography
          component="p"
          sx={{
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            fontSize: sidebarAbierto ? 26 : 17,
            textShadow: sombraRotulo(),
          }}
        >
          {sidebarAbierto ? "SCIPOS" : "SC"}
        </Typography>
        {sidebarAbierto && (
          <Typography
            variant="overline"
            sx={{ mt: 0.75, fontSize: 9, color: SOBRE_ESMALTE.textoTenue, lineHeight: 1.2 }}
          >
            Sistema Comercial
          </Typography>
        )}
      </Box>
      <List
        sx={{
          px: 1,
          mt: 1,
          flexGrow: 1,
          overflowY: "auto",
          "&::-webkit-scrollbar": { display: "none" },
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        {itemsVisibles.map((item) => {
          const Icono = ICONOS[item.icono];
          const activo = pathname === item.ruta || pathname.startsWith(`${item.ruta}/`);
          return (
            <Tooltip title={!sidebarAbierto ? item.etiqueta : ""} placement="right" key={item.ruta}>
              <ListItemButton
                component={Link}
                href={item.ruta}
                selected={activo}
                onClick={onNavegar}
                sx={{
                  borderRadius: 0,
                  mb: 0.25,
                  justifyContent: sidebarAbierto ? "initial" : "center",
                  px: sidebarAbierto ? 2 : 1,
                  // Etiqueta de rótulo: versalitas espaciadas.
                  "& .MuiListItemText-primary": {
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    letterSpacing: "0.09em",
                    textTransform: "uppercase",
                  },
                  color: activo ? SOBRE_ESMALTE.texto : SOBRE_ESMALTE.textoTenue,
                  // El módulo activo se marca con banda de pintura, no con píldora.
                  borderLeft: "4px solid",
                  borderLeftColor: activo ? ESMALTE.ocre : "transparent",
                  bgcolor: activo ? SOBRE_ESMALTE.activo : "transparent",
                  "&.Mui-selected": { bgcolor: SOBRE_ESMALTE.activo },
                  "&.Mui-selected:hover": { bgcolor: SOBRE_ESMALTE.activo },
                  "&:hover": {
                    bgcolor: SOBRE_ESMALTE.hover,
                    color: SOBRE_ESMALTE.texto,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    mr: sidebarAbierto ? 2 : "auto",
                    justifyContent: "center",
                    color: "inherit",
                  }}
                >
                  <Icono fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={item.etiqueta}
                  sx={{
                    opacity: sidebarAbierto ? 1 : 0,
                    display: sidebarAbierto ? "block" : "none",
                  }}
                />
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      <Divider sx={{ borderColor: SOBRE_ESMALTE.divisor }} />

      {/* Cerrar sesión, y la firma del equipo al pie del muro. */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: sidebarAbierto ? "space-between" : "center",
          gap: 1,
        }}
      >
        {sidebarAbierto && (
          <Typography
            variant="overline"
            sx={{ fontSize: 8.5, color: SOBRE_ESMALTE.textoFirma, lineHeight: 1 }}
          >
            LOBOSOFT
          </Typography>
        )}
        <Tooltip title="Cerrar sesión" placement={sidebarAbierto ? "top" : "right"}>
          <IconButton
            color="inherit"
            onClick={cerrarSesion}
            size="small"
            sx={{ color: SOBRE_ESMALTE.textoTenue, "&:hover": { color: ESMALTE.ocre } }}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

/** Menú lateral. Permanente en escritorio, temporal (cajón) en móvil. */
export function Sidebar({
  ancho,
  menuMovilAbierto,
  onCerrarMenu,
  sidebarAbierto = true,
  onToggleSidebar,
}: SidebarProps) {
  return (
    <Box
      component="nav"
      sx={{
        width: { md: ancho },
        flexShrink: { md: 0 },
        transition: (theme) =>
          theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
      }}
    >
      {/* Móvil */}
      <Drawer
        variant="temporary"
        open={menuMovilAbierto}
        onClose={onCerrarMenu}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: ancho,
            bgcolor: ESMALTE.azul,
          },
        }}
      >
        <Contenido onNavegar={onCerrarMenu} sidebarAbierto={true} />
      </Drawer>
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: ancho,
            overflow: "visible", // Permitir que la flechita sobresalga
            transition: (theme) =>
              theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
          },
        }}
        PaperProps={{
          sx: { overflow: "visible", bgcolor: ESMALTE.azul },
        }}
      >
        <Contenido sidebarAbierto={sidebarAbierto} onToggleSidebar={onToggleSidebar} />
      </Drawer>
    </Box>
  );
}
