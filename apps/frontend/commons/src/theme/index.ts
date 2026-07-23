"use client";

import { createTheme } from "@mui/material/styles";

/**
 * Tema base de SCIPOS. Define la identidad visual compartida por todos los
 * microfrontends (colores, tipografía, formas). Todos los módulos deben usar
 * este tema para verse consistentes (RNF-12).
 */
export const temaScipos = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1f3a5f",
      light: "#41618a",
      dark: "#122438",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#e08e0b",
      light: "#f0a83a",
      dark: "#a86705",
      contrastText: "#ffffff",
    },
    success: { main: "#2e7d32" },
    error: { main: "#c62828" },
    background: {
      default: "#f4f6f8",
      paper: "#ffffff",
    },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: ["Roboto", "Segoe UI", "Helvetica", "Arial", "sans-serif"].join(","),
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    // En pantallas chicas los diálogos ocupan casi todo el viewport para que
    // los formularios se puedan operar cómodamente desde un celular.
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          [theme.breakpoints.down("sm")]: {
            margin: theme.spacing(1),
            width: `calc(100% - ${theme.spacing(2)})`,
            maxWidth: `calc(100% - ${theme.spacing(2)})`,
            maxHeight: `calc(100% - ${theme.spacing(2)})`,
          },
        }),
      },
    },
    // Las tablas siempre pueden desplazarse horizontalmente si no caben.
    MuiTableContainer: {
      styleOverrides: {
        root: { overflowX: "auto" },
      },
    },
  },
});

export default temaScipos;
