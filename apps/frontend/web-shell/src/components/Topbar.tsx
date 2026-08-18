"use client";

import MenuIcon from "@mui/icons-material/Menu";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { ETIQUETAS_ROL, PLANO, usePermisos } from "@scipos/frontend-commons";

interface TopbarProps {
  anchoMenu: number;
  onAbrirMenu: () => void;
}

/**
 * Franja superior del armazón. Deliberadamente callada: el rótulo del módulo
 * es quien nombra la pantalla, así que aquí solo viven el acceso al menú en
 * móvil y la identidad de quien opera.
 */
export function Topbar({ anchoMenu, onAbrirMenu }: TopbarProps) {
  const { usuario, rol } = usePermisos();

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${anchoMenu}px)` },
        ml: { md: `${anchoMenu}px` },
        bgcolor: PLANO.papel,
        color: PLANO.tinta,
        backgroundImage: "none",
        boxShadow: "none",
        transition: (theme) =>
          theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.enteringScreen,
          }),
      }}
    >
      <Toolbar variant="dense" sx={{ minHeight: { xs: 52, md: 48 } }}>
        <IconButton
          edge="start"
          onClick={onAbrirMenu}
          sx={{ mr: 1.5, display: { md: "none" } }}
          aria-label="Abrir menú"
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />

        {usuario && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Chip label={ETIQUETAS_ROL[rol]} color="secondary" size="small" />
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, display: { xs: "none", sm: "block" } }}
            >
              {usuario.nombre}
            </Typography>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
