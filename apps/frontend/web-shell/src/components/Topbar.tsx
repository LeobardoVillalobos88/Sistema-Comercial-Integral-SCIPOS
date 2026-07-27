"use client";

import MenuIcon from "@mui/icons-material/Menu";
import AppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { ETIQUETAS_ROL, usePermisos } from "@scipos/frontend-commons";

interface TopbarProps {
  anchoMenu: number;
  onAbrirMenu: () => void;
}

/**
 * Barra superior del armazón.
 */
export function Topbar({ anchoMenu, onAbrirMenu }: TopbarProps) {
  const { usuario, rol } = usePermisos();

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${anchoMenu}px)` },
        ml: { md: `${anchoMenu}px` },
        borderBottom: 1,
        borderColor: "divider",
        transition: (theme) => theme.transitions.create(["width", "margin"], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          onClick={onAbrirMenu}
          sx={{ mr: 2, display: { md: "none" } }}
          aria-label="Abrir menú"
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          component="div"
          noWrap
          sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }}
        >
          Sistema Comercial Integral
        </Typography>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, display: { xs: "block", sm: "none" } }}
        >
          SCIPOS
        </Typography>

        {usuario && (
          <Box sx={{ textAlign: "right", ml: 2, display: { xs: "none", sm: "block" } }}>
            <Typography variant="body2" fontWeight="bold">
              {usuario.nombre}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {ETIQUETAS_ROL[rol]}
            </Typography>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
