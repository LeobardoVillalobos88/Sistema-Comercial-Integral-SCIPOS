"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ESMALTE, SOBRE_ESMALTE, sombraRotulo } from "../theme";

export interface AccionError {
  etiqueta: string;
  onClick?: () => void;
  /** Destino, para las salidas que son un enlace y no una acción. */
  href?: string;
  variante?: "principal" | "secundaria";
}

export interface PaginaErrorProps {
  /** Código HTTP. Se pinta a escala de rótulo, como decoración. */
  codigo: number | string;
  titulo: string;
  /** Qué pasó y qué hacer, en dos renglones y en español de persona. */
  descripcion: string;
  /** Salidas de emergencia. La primera se pinta como acción principal. */
  acciones?: AccionError[];
  /**
   * La pantalla se muestra dentro del armazón, no sola. Se usa para el acceso
   * denegado: el usuario sigue con sesión, así que conviene dejarle el menú a
   * la vista en lugar de taparle el sistema entero.
   */
  enMarco?: boolean;
}

/**
 * Pantalla de error a página completa. Se usa para las fallas de navegación
 * (no existe, no tienes acceso, se cayó el servidor); un error a media tarea
 * dentro de un módulo se avisa con un toast, porque sacar al usuario de lo que
 * estaba haciendo sería peor que el error.
 *
 * Sigue el muro rotulado: campo de esmalte, cifra display con sombra dura y
 * banda ocre recta. El texto habla en humano y siempre ofrece por dónde salir.
 */
export function PaginaError({
  codigo,
  titulo,
  descripcion,
  acciones = [],
  enMarco = false,
}: PaginaErrorProps) {
  return (
    <Box
      sx={{
        // Dentro del armazón se descuenta la franja superior, para llenar lo
        // que queda del alto sin empujar la página a tener barra de scroll.
        minHeight: enMarco ? { xs: "calc(100vh - 52px)", md: "calc(100vh - 48px)" } : "100vh",
        width: "100%",
        bgcolor: ESMALTE.azul,
        color: SOBRE_ESMALTE.texto,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 3, sm: 6 },
        py: 8,
      }}
    >
      <Box sx={{ maxWidth: 620, width: "100%" }}>
        <Typography
          component="p"
          aria-hidden
          sx={{
            fontWeight: 900,
            color: ESMALTE.ocre,
            fontSize: "clamp(5rem, 20vw, 10rem)",
            lineHeight: 0.82,
            letterSpacing: "-0.04em",
            textShadow: sombraRotulo(),
          }}
        >
          {codigo}
        </Typography>

        {/* Banda recta: separa sin recurrir a una sombra difusa. */}
        <Box sx={{ width: 72, height: 6, bgcolor: ESMALTE.ocre, mt: 3, mb: 3 }} />

        <Typography variant="h4" component="h1" sx={{ mb: 1.5 }}>
          {titulo}
        </Typography>
        <Typography variant="body1" sx={{ color: SOBRE_ESMALTE.textoTenue, maxWidth: "48ch" }}>
          {descripcion}
        </Typography>

        {acciones.length > 0 && (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 4 }}>
            {acciones.map((accion) => {
              const esPrincipal = accion.variante !== "secundaria";
              return (
                <Button
                  key={accion.etiqueta}
                  onClick={accion.onClick}
                  href={accion.href}
                  component={accion.href ? "a" : "button"}
                  variant={esPrincipal ? "contained" : "outlined"}
                  color="secondary"
                  sx={
                    esPrincipal
                      ? undefined
                      : {
                          color: SOBRE_ESMALTE.texto,
                          borderColor: SOBRE_ESMALTE.divisor,
                          "&:hover": {
                            borderColor: SOBRE_ESMALTE.texto,
                            bgcolor: SOBRE_ESMALTE.hover,
                          },
                        }
                  }
                >
                  {accion.etiqueta}
                </Button>
              );
            })}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
