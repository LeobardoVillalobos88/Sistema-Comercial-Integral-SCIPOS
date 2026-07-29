"use client";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ESMALTE, PLANO, SOBRE_ESMALTE } from "@scipos/frontend-commons";
import { useState } from "react";

export interface LoginViewProps {
  onLogin: (correo: string, contrasena: string) => Promise<void>;
}

/**
 * Pantalla de inicio de sesión (RF-01). Recibe las credenciales y delega en
 * `onLogin`, que abre la sesión real contra el servicio de seguridad.
 *
 * Es la primera pantalla del sistema y por eso lleva el rótulo a su escala
 * completa: el muro de esmalte con el nombre pintado, y la placa de
 * credenciales montada encima.
 */
export function LoginView({ onLogin }: LoginViewProps) {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alEnviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await onLogin(correo, contrasena);
      // En caso de éxito la navegación desmonta esta vista; no reactivamos el botón.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Credenciales inválidas. Intente de nuevo.");
      setCargando(false);
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", flexDirection: { xs: "column", md: "row" } }}>
      {/* El muro rotulado */}
      <Box
        sx={{
          flex: { xs: "0 0 auto", md: 1.15 },
          bgcolor: ESMALTE.azul,
          color: SOBRE_ESMALTE.texto,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          px: { xs: 3, md: 7 },
          py: { xs: 5, md: 7 },
        }}
      >
        <Typography
          component="h1"
          sx={{
            fontWeight: 900,
            fontSize: { xs: "3.75rem", md: "5.75rem" },
            lineHeight: 0.84,
            letterSpacing: "-0.045em",
            textShadow: `7px 7px 0 ${ESMALTE.azulHondo}`,
          }}
        >
          SCIPOS
        </Typography>

        <Typography
          variant="overline"
          sx={{
            mt: { xs: 2, md: 3 },
            fontSize: { xs: 11, md: 13 },
            letterSpacing: "0.26em",
            color: SOBRE_ESMALTE.textoTenue,
          }}
        >
          Sistema Comercial Integral
        </Typography>

        {/* Flecha de rótulo: una banda de ocre que dirige a la placa. */}
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: { xs: 3, md: 4.5 } }}>
          <Box sx={{ height: 5, width: { xs: 56, md: 88 }, bgcolor: ESMALTE.ocre }} />
          <Typography
            variant="overline"
            sx={{ fontSize: 10.5, letterSpacing: "0.17em", color: ESMALTE.ocre }}
          >
            Acceso al sistema
          </Typography>
        </Stack>
      </Box>

      {/* La placa de credenciales */}
      <Box
        sx={{
          flex: { xs: 1, md: 0.85 },
          bgcolor: PLANO.papel,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 3, md: 5 },
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            width: "100%",
            maxWidth: 400,
            p: { xs: 3, md: 4.5 },
            // Banda de pintura arriba: por eso el panel va a esquina recta.
            borderRadius: 0,
            borderTop: `5px solid ${ESMALTE.ocre}`,
          }}
        >
          <Typography variant="h5">Bienvenido</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 3 }}>
            Ingresa tus credenciales para continuar
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={alEnviar} noValidate>
            <Stack spacing={2.5}>
              <TextField
                type="email"
                label="Correo electrónico"
                value={correo}
                onChange={(evento) => setCorreo(evento.target.value)}
                required
                disabled={cargando}
                fullWidth
                autoComplete="email"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <MailOutlineIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                type="password"
                label="Contraseña"
                value={contrasena}
                onChange={(evento) => setContrasena(evento.target.value)}
                required
                disabled={cargando}
                fullWidth
                autoComplete="current-password"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={cargando}
                startIcon={
                  cargando ? <CircularProgress size={20} color="inherit" /> : <LoginRoundedIcon />
                }
                sx={{ mt: 0.5, py: 1.4 }}
              >
                {cargando ? "Ingresando…" : "Ingresar al sistema"}
              </Button>
            </Stack>
          </Box>

          <Typography
            variant="overline"
            sx={{ display: "block", mt: 3.5, fontSize: 8.5, color: PLANO.tintaSuave }}
          >
            LOBOSOFT
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}

export default LoginView;
