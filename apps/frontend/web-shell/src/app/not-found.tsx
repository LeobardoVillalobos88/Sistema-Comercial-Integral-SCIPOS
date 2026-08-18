import { PantallaError } from "@/components/PantallaError";

/** Cualquier dirección que no corresponda a una ruta del sistema cae aquí. */
export default function NoEncontrado() {
  return <PantallaError codigo={404} />;
}
