import { Logger } from "@nestjs/common";

export function crearLogger(nombreServicio: string): Logger {
  return new Logger(nombreServicio);
}
