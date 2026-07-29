"use client";

import { createTheme } from "@mui/material/styles";

/**
 * Tema base de SCIPOS. Define la identidad visual compartida por todos los
 * microfrontends (colores, tipografía, formas). Todos los módulos deben usar
 * este tema para verse consistentes (RNF-12).
 *
 * El mundo visual es "El Muro Rotulado": campos de esmalte profundo sobre un
 * plano de trabajo claro, mayúsculas condensadas con sombra dura, bandas
 * rectas y cero sombras difusas. Las reglas completas viven en DESIGN.md.
 */

/** Campos de esmalte de la marca. Son colores de fondo, con tinta o panel encima. */
export const ESMALTE = {
  /** El color del muro: barra lateral, barra superior, bandas y acción primaria. */
  azul: "#101F52",
  /** Estado presionado y sombra dura del rótulo. */
  azulHondo: "#060F33",
  /** Marca lo que hay que mirar: totales, saldos, privilegios concedidos. */
  ocre: "#D98A00",
  rojo: "#C31F1F",
  verde: "#1B6B3A",
} as const;

/** Neutros del plano de trabajo. Fríos, nunca crema. */
export const PLANO = {
  tinta: "#0E1420",
  tintaSuave: "#54607A",
  papel: "#EEF1F6",
  panel: "#FFFFFF",
  regla: "#C3CBD9",
} as const;

/**
 * Texto sobre el campo de esmalte. Vive aparte de la paleta porque el tema
 * opera en modo claro y estas superficies son oscuras por diseño.
 */
export const SOBRE_ESMALTE = {
  texto: "#FFFFFF",
  textoTenue: "#AAB7DE",
  textoFirma: "#7C8CBB",
  divisor: "rgba(255,255,255,0.18)",
  activo: "rgba(255,255,255,0.13)",
  hover: "rgba(255,255,255,0.08)",
} as const;

const FAMILIA = "var(--fuente-rotulo), 'Archivo', system-ui, sans-serif";

/** Sombra dura del rótulo: sólida y sin difuminar. Solo a escala display. */
export const sombraRotulo = (color: string = ESMALTE.azulHondo) => `3px 3px 0 ${color}`;

/** Cifras comparables de un vistazo: tabulares y alineadas a la derecha. */
export const CIFRA = {
  fontVariantNumeric: "tabular-nums",
  fontWeight: 700,
} as const;

export const temaScipos = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: ESMALTE.azul,
      dark: ESMALTE.azulHondo,
      light: "#24356E",
      contrastText: SOBRE_ESMALTE.texto,
    },
    secondary: {
      main: ESMALTE.ocre,
      dark: "#B37200",
      light: "#EFA92C",
      // El ocre es campo con tinta encima, nunca texto ocre sobre blanco.
      contrastText: PLANO.tinta,
    },
    success: { main: ESMALTE.verde, contrastText: SOBRE_ESMALTE.texto },
    error: { main: ESMALTE.rojo, contrastText: SOBRE_ESMALTE.texto },
    warning: { main: ESMALTE.ocre, contrastText: PLANO.tinta },
    info: { main: ESMALTE.azul, contrastText: SOBRE_ESMALTE.texto },
    text: {
      primary: PLANO.tinta,
      secondary: PLANO.tintaSuave,
    },
    divider: PLANO.regla,
    background: {
      default: PLANO.papel,
      paper: PLANO.panel,
    },
  },
  // Casi recto: un radio grande es lenguaje de tarjeta de software, no de
  // panel pintado. Las bandas van a cero y se fijan por componente.
  shape: {
    borderRadius: 2,
  },
  typography: {
    fontFamily: FAMILIA,
    // El rótulo: escala display con sombra dura, solo para el nombre del
    // sistema y los números que dominan una pantalla.
    h1: { fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 0.88 },
    h2: { fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 0.92 },
    h3: { fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 },
    h4: { fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.05 },
    h5: { fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.1 },
    h6: { fontWeight: 700, lineHeight: 1.2 },
    body1: { fontSize: "0.9375rem", lineHeight: 1.55 },
    body2: { fontSize: "0.875rem", lineHeight: 1.5 },
    // Las etiquetas son versalitas espaciadas, como en un rótulo.
    overline: {
      fontWeight: 700,
      fontSize: "0.75rem",
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      lineHeight: 1.4,
    },
    button: {
      textTransform: "uppercase",
      fontWeight: 800,
      letterSpacing: "0.11em",
      fontSize: "0.8125rem",
    },
  },
  components: {
    // La pintura es plana: ninguna superficie lleva sombra difuminada.
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: "none", boxShadow: "none" },
        outlined: { border: `1px solid ${PLANO.regla}` },
      },
    },
    MuiCard: {
      defaultProps: { variant: "outlined", elevation: 0 },
      styleOverrides: {
        root: { boxShadow: "none", border: `1px solid ${PLANO.regla}` },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "primary" },
      styleOverrides: {
        root: { boxShadow: "none", backgroundImage: "none" },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          boxShadow: "none",
          paddingInline: 20,
          paddingBlock: 9,
          "&:hover": { boxShadow: "none" },
          // El foco es un contorno sólido, nunca un halo difuso.
          "&.Mui-focusVisible": {
            outline: `2px solid ${ESMALTE.azul}`,
            outlineOffset: 2,
          },
        },
        outlined: { borderColor: PLANO.regla, color: PLANO.tinta },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          "&.Mui-focusVisible": {
            outline: `2px solid ${ESMALTE.azul}`,
            outlineOffset: 2,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          fontWeight: 800,
          fontSize: "0.6875rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          height: 24,
        },
        outlined: { borderColor: PLANO.regla, color: PLANO.tintaSuave },
      },
    },
    // Encabezado de tabla como banda de etiqueta; cifras comparables.
    MuiTableHead: {
      styleOverrides: {
        root: { backgroundColor: "#F7F9FC" },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: "1px solid #E6EBF2" },
        head: {
          fontWeight: 800,
          fontSize: "0.6875rem",
          letterSpacing: "0.13em",
          textTransform: "uppercase",
          color: PLANO.tintaSuave,
          borderBottom: `1px solid ${PLANO.regla}`,
        },
        alignRight: { fontVariantNumeric: "tabular-nums" },
      },
    },
    // Las tablas siempre pueden desplazarse horizontalmente si no caben.
    MuiTableContainer: {
      styleOverrides: {
        root: { overflowX: "auto" },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: PLANO.panel,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: PLANO.regla },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: PLANO.tintaSuave },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderWidth: 2,
            borderColor: ESMALTE.azul,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 2, fontWeight: 500 },
        // El mensaje de error va en tinta legible, no en rojo sobre rojo.
        standardError: { backgroundColor: "#FBE9E9", color: PLANO.tinta },
        standardSuccess: { backgroundColor: "#E7F2EC", color: PLANO.tinta },
        standardWarning: { backgroundColor: "#FBF0DC", color: PLANO.tinta },
        standardInfo: { backgroundColor: "#E7EAF4", color: PLANO.tinta },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: PLANO.tinta,
          borderRadius: 2,
          fontSize: "0.75rem",
          fontWeight: 600,
          letterSpacing: "0.02em",
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { height: 4, backgroundColor: ESMALTE.ocre },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "uppercase",
          fontWeight: 800,
          letterSpacing: "0.1em",
          fontSize: "0.75rem",
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: PLANO.regla },
      },
    },
    // En pantallas chicas los diálogos ocupan casi todo el viewport para que
    // los formularios se puedan operar cómodamente desde un celular.
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: 0,
          borderTop: `4px solid ${ESMALTE.azul}`,
          [theme.breakpoints.down("sm")]: {
            margin: theme.spacing(1),
            width: `calc(100% - ${theme.spacing(2)})`,
            maxWidth: `calc(100% - ${theme.spacing(2)})`,
            maxHeight: `calc(100% - ${theme.spacing(2)})`,
          },
        }),
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontWeight: 800, letterSpacing: "-0.01em" },
      },
    },
  },
});

export default temaScipos;
