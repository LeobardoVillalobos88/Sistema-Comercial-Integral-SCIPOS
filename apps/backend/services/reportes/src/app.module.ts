import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ModuloSeguridad } from "@scipos/backend-commons";
import { HealthController } from "./health/health.controller";
import { RedisModule } from "./redis/redis.module";
import { ReportesModule } from "./reportes/reportes.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule,
    ReportesModule,
    // El guard valida privilegios consultando al servicio de seguridad
    // (SEGURIDAD_URL) en cada endpoint decorado con @RequierePrivilegio.
    ModuloSeguridad.registrar(),
  ],
  controllers: [HealthController],
})
export class AppModule {}
