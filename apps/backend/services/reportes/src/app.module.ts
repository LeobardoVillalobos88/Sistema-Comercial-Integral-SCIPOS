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
    ModuloSeguridad.registrar(),
  ],
  controllers: [HealthController],
})
export class AppModule {}
