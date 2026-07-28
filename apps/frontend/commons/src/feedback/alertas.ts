import Swal from "sweetalert2";
import { temaScipos } from "../theme";

// SweetAlert2 se dibuja fuera del árbol de React, así que los colores se leen
// del tema en lugar de tomarlos del contexto.
const COLOR_PRIMARIO = temaScipos.palette.primary.main;
/** Gris azulado propio de los botones de cancelar; no existe en la paleta. */
const COLOR_CANCELAR = "#8a94a6";

interface OpcionesConfirmar {
  titulo: string;
  texto?: string;
  /** Texto del botón de confirmar. */
  confirmar?: string;
  /** Icono del modal. Por defecto "warning". */
  icono?: "warning" | "question" | "info";
}

/**
 * Muestra un diálogo de confirmación (sweet alert) y resuelve a `true` si el
 * usuario confirma. Úsalo antes de acciones sensibles (desactivar, eliminar…).
 *
 * Ejemplo:
 *   if (await confirmar({ titulo: "¿Desactivar producto?" })) { ... }
 */
export function confirmar(opciones: OpcionesConfirmar): Promise<boolean> {
  return Swal.fire({
    title: opciones.titulo,
    text: opciones.texto,
    icon: opciones.icono ?? "warning",
    showCancelButton: true,
    confirmButtonText: opciones.confirmar ?? "Sí, continuar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: COLOR_PRIMARIO,
    cancelButtonColor: COLOR_CANCELAR,
    reverseButtons: true,
  }).then((resultado) => resultado.isConfirmed);
}

/** Sweet alert de éxito. */
export function alertaExito(titulo: string, texto?: string): Promise<unknown> {
  return Swal.fire({
    title: titulo,
    text: texto,
    icon: "success",
    confirmButtonColor: COLOR_PRIMARIO,
  });
}

/** Sweet alert de error. */
export function alertaError(titulo: string, texto?: string): Promise<unknown> {
  return Swal.fire({
    title: titulo,
    text: texto,
    icon: "error",
    confirmButtonColor: COLOR_PRIMARIO,
  });
}
