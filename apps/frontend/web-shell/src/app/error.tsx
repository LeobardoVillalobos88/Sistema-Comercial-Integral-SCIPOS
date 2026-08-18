"use client";

import { PantallaError } from "@/components/PantallaError";
import { useEffect } from "react";

/**
 * Frontera de error de React: atrapa cualquier fallo al renderizar una ruta.
 * `reset` reintenta pintar el mismo árbol sin recargar la aplicación entera.
 */
export default function ErrorDeRuta({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sin esto el fallo se pierde: la pantalla no muestra detalles técnicos.
    console.error(error);
  }, [error]);

  return <PantallaError codigo={500} onReintentar={reset} />;
}
