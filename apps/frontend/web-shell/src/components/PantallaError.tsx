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
  onReintentar?: () => void;
  enMarco?: boolean;
}

export function PantallaError({ codigo, onReintentar, enMarco = false }: PantallaErrorProps) {
  const router = useRouter();
  const { cerrarSesion } = usePermisos();
  const contenido = CONTENIDO_ERROR[codigo];

  const irAlInicio: AccionError = {
    etiqueta: "Ir al inicio",
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
