"use client";

import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

type TipoToast = "success" | "error" | "info";

interface EstadoToast {
  abierto: boolean;
  mensaje: string;
  tipo: TipoToast;
}

export interface ToastContextValue {
  /** Verde con check. Éxito de una operación. */
  exito: (mensaje: string) => void;
  /** Rojo con equis. Error u operación fallida. */
  error: (mensaje: string) => void;
  /** Azul con signo de exclamación. Retroalimentación informativa. */
  info: (mensaje: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Iconos por tipo: éxito = check, error = equis, info = exclamación.
const ICONOS = {
  success: <CheckCircleIcon fontSize="inherit" />,
  error: <CancelIcon fontSize="inherit" />,
  info: <PriorityHighIcon fontSize="inherit" />,
};

/** Proveedor de notificaciones tipo toast (esquina inferior derecha). */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<EstadoToast>({
    abierto: false,
    mensaje: "",
    tipo: "info",
  });

  const mostrar = useCallback((mensaje: string, tipo: TipoToast) => {
    setEstado({ abierto: true, mensaje, tipo });
  }, []);

  const cerrar = useCallback(() => {
    setEstado((actual) => ({ ...actual, abierto: false }));
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      exito: (mensaje) => mostrar(mensaje, "success"),
      error: (mensaje) => mostrar(mensaje, "error"),
      info: (mensaje) => mostrar(mensaje, "info"),
    }),
    [mostrar],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={estado.abierto}
        autoHideDuration={4000}
        onClose={cerrar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={cerrar}
          severity={estado.tipo}
          variant="filled"
          iconMapping={ICONOS}
          sx={{ minWidth: 300, alignItems: "center" }}
        >
          {estado.mensaje}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

/**
 * Hook para lanzar notificaciones toast.
 * Ejemplo: const toast = useToast(); toast.exito("Producto guardado.");
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast debe usarse dentro de <ToastProvider>.");
  }
  return ctx;
}
