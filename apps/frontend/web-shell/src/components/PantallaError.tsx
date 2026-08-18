"use client";

import {
  type AccionError,
  CONTENIDO_ERROR,
  type CodigoError,
  PaginaError,
  usePermisos,
} from "@scipos/frontend-commons";
import { useRouter } from "next/navigation";

interface PantallaErrorProps {
  codigo: CodigoError;
  /**
   * Qué hacer al reintentar. En el 500 lo provee la frontera de error de React
   * con su `reset`; en el resto se recarga la ruta.
   */
  onReintentar?: () => void;
  /** La pantalla vive dentro del armazón y conserva el menú. */
  enMarco?: boolean;
}

/**
 * Pantalla de error del shell: toma el texto compartido y le conecta salidas
 * que de verdad llevan a algún lado. Cada ruta de /error y el propio armazón
 * la usan, para que el mismo código se explique siempre igual.
 */
export function PantallaError({ codigo, onReintentar, enMarco = false }: PantallaErrorProps) {
  const router = useRouter();
  const { cerrarSesion } = usePermisos();
  const contenido = CONTENIDO_ERROR[codigo];

  const irAlInicio: AccionError = {
    etiqueta: "Ir al inicio",
    // El inicio no exige privilegio: es destino seguro para cualquier rol.
    onClick: () => router.push("/inicio"),
  };
  const regresar: AccionError = {
    etiqueta: "Regresar",
    variante: "secundaria",
    onClick: () => router.back(),
  };
  const reintentar: AccionError = {
    etiqueta: "Reintentar",
    onClick: onReintentar ?? (() => window.location.reload()),
  };

  const acciones: AccionError[] =
    codigo === 401
      ? [
          {
            etiqueta: "Iniciar sesión otra vez",
            onClick: () => {
              cerrarSesion();
              router.replace("/login");
            },
          },
        ]
      : codigo === 500 || codigo === 503
        ? [reintentar, { ...irAlInicio, variante: "secundaria" }]
        : [irAlInicio, regresar];

  return (
    <PaginaError
      codigo={codigo}
      titulo={contenido.titulo}
      descripcion={contenido.descripcion}
      acciones={acciones}
      enMarco={enMarco}
    />
  );
}
