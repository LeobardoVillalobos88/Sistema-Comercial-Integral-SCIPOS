import Swal from "sweetalert2";
import { temaScipos } from "../theme";

const COLOR_PRIMARIO = temaScipos.palette.primary.main;
const COLOR_CANCELAR = "#8a94a6";

interface OpcionesConfirmar {
  titulo: string;
  texto?: string;
  confirmar?: string;
  icono?: "warning" | "question" | "info";
}

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

export function alertaExito(titulo: string, texto?: string): Promise<unknown> {
  return Swal.fire({
    title: titulo,
    text: texto,
    icon: "success",
    confirmButtonColor: COLOR_PRIMARIO,
  });
}

export function alertaError(titulo: string, texto?: string): Promise<unknown> {
  return Swal.fire({
    title: titulo,
    text: texto,
    icon: "error",
    confirmButtonColor: COLOR_PRIMARIO,
  });
}
