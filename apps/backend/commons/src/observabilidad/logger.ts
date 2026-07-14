import { Logger } from "@nestjs/common";

/**
 * Crea el logger estándar de un servicio. Centralizarlo aquí permite cambiar
 * la implementación de logging en un solo lugar para todo el backend.
 */
export function crearLogger(nombreServicio: string): Logger {
  return new Logger(nombreServicio);
}
