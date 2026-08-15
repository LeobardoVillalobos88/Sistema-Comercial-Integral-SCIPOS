import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ModuloSeguridad } from "@scipos/backend-commons";
import { ComprasModule } from "./compras/compras.module";
import { HealthController } from "./health/health.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { ProductosModule } from "./productos/productos.module";
import { RedisModule } from "./redis/redis.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    ProductosModule,
    ComprasModule,
    ModuloSeguridad.registrar(),
  ],
  controllers: [HealthController],
})
export class AppModule {}
