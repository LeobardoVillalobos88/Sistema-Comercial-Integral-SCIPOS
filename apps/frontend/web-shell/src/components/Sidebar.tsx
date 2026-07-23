"use client";

import { NAVEGACION } from "@/config/navegacion";
import AssessmentIcon from "@mui/icons-material/Assessment";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DescriptionIcon from "@mui/icons-material/Description";
import InsightsIcon from "@mui/icons-material/Insights";
import InventoryIcon from "@mui/icons-material/Inventory2";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import PeopleIcon from "@mui/icons-material/People";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import SavingsIcon from "@mui/icons-material/Savings";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { usePermisos } from "@scipos/frontend-commons";
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
}

function Contenido({ onNavegar }: { onNavegar?: () => void }) {
  const pathname = usePathname();
  const { can } = usePermisos();

  // Solo se muestran los módulos cuyo privilegio tiene el rol actual.
  const itemsVisibles = NAVEGACION.filter((item) => !item.privilegio || can(item.privilegio));

  return (
    <Box>
      <Box
        component="img"
        src="/logo-lobosoft.png"
        alt="LOBOSOFT"
        sx={{ width: "100%", height: "auto", display: "block" }}
      />
      <List sx={{ px: 1, mt: 1 }}>
        {itemsVisibles.map((item) => {
          const Icono = ICONOS[item.icono];
          const activo = pathname === item.ruta || pathname.startsWith(`${item.ruta}/`);
          return (
            <ListItemButton
              key={item.ruta}
              component={Link}
              href={item.ruta}
              selected={activo}
              onClick={onNavegar}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Icono fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={item.etiqueta} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}

/** Menú lateral. Permanente en escritorio, temporal (cajón) en móvil. */
export function Sidebar({ ancho, menuMovilAbierto, onCerrarMenu }: SidebarProps) {
  return (
    <Box component="nav" sx={{ width: { md: ancho }, flexShrink: { md: 0 } }}>
      {/* Móvil */}
      <Drawer
        variant="temporary"
        open={menuMovilAbierto}
        onClose={onCerrarMenu}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: ancho },
        }}
      >
        <Contenido onNavegar={onCerrarMenu} />
      </Drawer>
      {/* Escritorio */}
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: ancho },
        }}
      >
        <Contenido />
      </Drawer>
    </Box>
  );
}
