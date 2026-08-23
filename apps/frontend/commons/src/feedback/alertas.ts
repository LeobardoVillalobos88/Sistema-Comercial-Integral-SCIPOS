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

const ESCAPES_HTML: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Escapa un texto para poder incrustarlo en el cuerpo HTML de una alerta.
 * Obligatorio para cualquier dato venido de la base (nombres, lotes): SweetAlert
 * los inserta como HTML, y sin escapar se convierten en una vía de inyección.
 */
export function escaparHtml(texto: string): string {
  return texto.replace(/[&<>"']/g, (caracter) => ESCAPES_HTML[caracter] ?? caracter);
}

interface OpcionesAlertaDetallada {
  titulo: string;
  /** Cuerpo en HTML. Todo dato interpolado debe pasar antes por `escaparHtml`. */
  html: string;
  /** Texto del botón de confirmar. */
  confirmar?: string;
  /** Texto del botón de cerrar. Si se omite, solo se muestra el de confirmar. */
  cancelar?: string;
  icono?: "warning" | "info" | "question";
  ancho?: string;
}

/**
 * Sweet alert con cuerpo compuesto: para avisos que traen una lista y no caben
 * en una línea. Resuelve a `true` si el usuario presionó el botón de confirmar.
 */
export function alertaDetallada(opciones: OpcionesAlertaDetallada): Promise<boolean> {
  return Swal.fire({
    title: opciones.titulo,
    html: opciones.html,
    icon: opciones.icono ?? "warning",
    width: opciones.ancho ?? "40rem",
    showCancelButton: Boolean(opciones.cancelar),
    confirmButtonText: opciones.confirmar ?? "Entendido",
    cancelButtonText: opciones.cancelar,
    confirmButtonColor: COLOR_PRIMARIO,
    cancelButtonColor: COLOR_CANCELAR,
    reverseButtons: true,
  }).then((resultado) => resultado.isConfirmed);
}
