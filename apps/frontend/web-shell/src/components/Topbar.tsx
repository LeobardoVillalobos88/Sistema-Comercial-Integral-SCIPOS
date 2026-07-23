"use client";

import BadgeIcon from "@mui/icons-material/Badge";
import MenuIcon from "@mui/icons-material/Menu";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { ETIQUETAS_ROL, usePermisos } from "@scipos/frontend-commons";
import type { Rol } from "@scipos/frontend-commons";

interface TopbarProps {
  anchoMenu: number;
  onAbrirMenu: () => void;
}

/**
 * Barra superior. Incluye el selector de rol: al cambiarlo, los módulos
 * muestran u ocultan acciones según los privilegios del rol elegido
 * (RF-04/RF-05).
 */
export function Topbar({ anchoMenu, onAbrirMenu }: TopbarProps) {
  const { rol, setRol, roles } = usePermisos();

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

        <FormControl size="small" sx={{ minWidth: { xs: 150, sm: 200 } }}>
          <Select
            value={rol}
            onChange={(e) => setRol(e.target.value as Rol)}
            startAdornment={
              <InputAdornment position="start">
                <BadgeIcon fontSize="small" />
              </InputAdornment>
            }
          >
            {roles.map((r) => (
              <MenuItem key={r} value={r}>
                {ETIQUETAS_ROL[r]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ width: 8 }} />
      </Toolbar>
    </AppBar>
  );
}
