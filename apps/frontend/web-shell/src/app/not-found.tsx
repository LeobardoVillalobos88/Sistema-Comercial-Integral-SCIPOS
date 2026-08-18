import { PantallaError } from "@/components/PantallaError";

/**
 * Cualquier dirección que no corresponda a una ruta del sistema cae aquí. Se
 * pinta dentro del armazón —Next la monta como contenido de la raíz—, así que
 * el usuario conserva el menú para irse a otro lado.
 */
export default function NoEncontrado() {
  return <PantallaError codigo={404} enMarco />;
}
