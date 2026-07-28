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
import { MARCA_OSCURA } from "@scipos/frontend-commons";
import { useState } from "react";

export interface LoginViewProps {
  onLogin: (correo: string, contrasena: string) => Promise<void>;
}

/**
 * Pantalla de inicio de sesión (RF-01). Recibe las credenciales y delega en
 * `onLogin`, que abre la sesión real contra el servicio de seguridad.
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
      {/* Lado de la marca */}
      <Box
        sx={{
          flex: { xs: "0 0 260px", md: 1 },
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 4,
          color: MARCA_OSCURA.texto,
          background: MARCA_OSCURA.degradado,
          "&::before": {
            content: '""',
            position: "absolute",
            top: "-10%",
            left: "-10%",
            width: "50vw",
            height: "50vw",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)",
            pointerEvents: "none",
          },
        }}
      >
        <Box sx={{ position: "relative", textAlign: "center" }}>
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: "2.75rem", md: "3.5rem" },
              fontWeight: 300,
              letterSpacing: { xs: "8px", md: "12px" },
              textTransform: "uppercase",
              textShadow: "0 4px 10px rgba(0,0,0,0.3)",
            }}
          >
            SCIPOS
          </Typography>
          <Typography
            sx={{
              mt: 1,
              fontSize: "1rem",
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: MARCA_OSCURA.textoTenue,
            }}
          >
            Sistema Comercial Integral
          </Typography>
        </Box>
      </Box>

      {/* Lado del formulario */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 3, md: 4 },
          bgcolor: "#f8fafc",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 420,
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            border: "1px solid #f1f5f9",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.04)",
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600, color: MARCA_OSCURA.fondo }}>
            Bienvenido
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, mb: 3, color: "#64748b" }}>
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
                sx={{
                  mt: 0.5,
                  py: 1.25,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  background: MARCA_OSCURA.degradado,
                  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.3)",
                  "&:hover": {
                    background: MARCA_OSCURA.degradadoHover,
                    boxShadow: "0 6px 20px rgba(15, 23, 42, 0.4)",
                  },
                }}
              >
                {cargando ? "Ingresando…" : "Ingresar al sistema"}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
