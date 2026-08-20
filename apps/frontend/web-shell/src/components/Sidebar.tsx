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
import type { Theme } from "@mui/material/styles";
import { ESMALTE, SOBRE_ESMALTE, sombraRotulo, usePermisos } from "@scipos/frontend-commons";
import { confirmar } from "@scipos/frontend-commons/feedback";
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

const SANGRIA = 2;
const COLUMNA_ICONO = 40;
const SEPARACION_TEXTO = 2;

const transicionMenu = (theme: Theme, propiedades: string | string[]) =>
  theme.transitions.create(propiedades, {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.enteringScreen,
  });

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

  const itemsVisibles = NAVEGACION.filter((item) => !item.privilegio || can(item.privilegio));

  const confirmarCierre = async () => {
    const confirmado = await confirmar({
      titulo: "¿Cerrar sesión?",
      texto: "Volverás a la pantalla de acceso y tendrás que iniciar sesión de nuevo.",
      confirmar: "Sí, cerrar sesión",
    });
    if (confirmado) {
      cerrarSesion();
    }
  };

  const revelado = {
    whiteSpace: "nowrap" as const,
    opacity: sidebarAbierto ? 1 : 0,
    transition: (theme: Theme) => transicionMenu(theme, "opacity"),
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        position: "relative",
        bgcolor: ESMALTE.azul,
        color: SOBRE_ESMALTE.texto,
      }}
    >
      {/* Botón flotante para expandir/colapsar (solo visible en escritorio si se pasa la función) */}
      {onToggleSidebar && (
        <IconButton
          onClick={onToggleSidebar}
          size="small"
          aria-label={sidebarAbierto ? "Contraer el menú" : "Expandir el menú"}
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

      {/* El rótulo no se reemplaza, se revela: SC está siempre plantado en el
          carril e IPOS crece a su derecha. Así las dos primeras letras no se
          mueven ni cambian de tamaño al abrir. */}
      <Box
        sx={{
          px: SANGRIA,
          minHeight: 76,
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          borderBottom: `1px solid ${SOBRE_ESMALTE.divisor}`,
        }}
      >
        <Typography
          component="p"
          sx={{
            display: "flex",
            fontWeight: 900,
            fontSize: 26,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            textShadow: sombraRotulo(),
          }}
        >
          <Box component="span">SC</Box>
          <Box
            component="span"
            sx={{
              maxWidth: sidebarAbierto ? 160 : 0,
              overflow: "hidden",
              ...revelado,
              transition: (theme) => transicionMenu(theme, ["max-width", "opacity"]),
            }}
          >
            IPOS
          </Box>
        </Typography>
      </Box>

      <List
        sx={{
          px: 0,
          mt: 1,
          flexGrow: 1,
          overflowY: "auto",
          overflowX: "hidden",
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
                  px: SANGRIA,
                  overflow: "hidden",
                  "& .MuiListItemText-primary": {
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    letterSpacing: "0.09em",
                    textTransform: "uppercase",
                  },
                  color: activo ? SOBRE_ESMALTE.texto : SOBRE_ESMALTE.textoTenue,
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
                    minWidth: COLUMNA_ICONO,
                    mr: SEPARACION_TEXTO,
                    flexShrink: 0,
                    justifyContent: "center",
                    color: "inherit",
                  }}
                >
                  <Icono fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={item.etiqueta} sx={revelado} />
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      <Divider sx={{ borderColor: SOBRE_ESMALTE.divisor }} />

      {/* Cerrar sesión, y la firma del equipo al pie del muro. Comparten la
          retícula de los renglones: el icono cae en la columna del carril. */}
      <Box
        sx={{
          px: SANGRIA,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            width: COLUMNA_ICONO,
            mr: SEPARACION_TEXTO,
            flexShrink: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Tooltip title="Cerrar sesión" placement="right">
            <IconButton
              color="inherit"
              onClick={confirmarCierre}
              size="small"
              aria-label="Cerrar sesión"
              sx={{ color: SOBRE_ESMALTE.textoTenue, "&:hover": { color: ESMALTE.ocre } }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Typography
          variant="overline"
          sx={{ fontSize: 8.5, color: SOBRE_ESMALTE.textoFirma, lineHeight: 1, ...revelado }}
        >
          LOBOSOFT
        </Typography>
      </Box>
    </Box>
  );
}

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
        transition: (theme) => transicionMenu(theme, "width"),
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
            overflow: "visible",
            transition: (theme) => transicionMenu(theme, "width"),
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
