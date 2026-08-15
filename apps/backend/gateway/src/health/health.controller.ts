import { Controller, Get } from "@nestjs/common";
import { serviciosEnrutados } from "../config/servicios";

@Controller()
export class HealthController {
  @Get("health")
  check() {
    return {
      status: "ok",
      service: "gateway",
      servicios: serviciosEnrutados().map((s) => ({
        ruta: `/api/${s.ruta}`,
        destino: s.url,
      })),
    };
  }

  @Get()
  raiz() {
    return {
      nombre: "SCIPOS API Gateway",
      documentacion: "Cada servicio publica su documentación en <servicio>/docs",
      rutas: serviciosEnrutados().map((s) => `/api/${s.ruta}`),
    };
  }
}
