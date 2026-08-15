import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ModuloSeguridad } from "@scipos/backend-commons";

import { validarEntorno } from "./config/validar-entorno";
import { CotizacionesModule } from "./cotizaciones/cotizaciones.module";
import { HealthController } from "./health/health.controller";
import { IntegracionesModule } from "./integraciones/integraciones.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validarEntorno }),
    PrismaModule,
    IntegracionesModule,
    CotizacionesModule,
    ModuloSeguridad.registrar(),
  ],
  controllers: [HealthController],
})
export class AppModule {}
