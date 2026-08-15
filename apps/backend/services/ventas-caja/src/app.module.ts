import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ModuloSeguridad } from "@scipos/backend-commons";
import { CajaModule } from "./caja/caja.module";
import { HealthController } from "./health/health.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { VentasModule } from "./ventas/ventas.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    CajaModule,
    VentasModule,
    ModuloSeguridad.registrar(),
  ],
  controllers: [HealthController],
})
export class AppModule {}
