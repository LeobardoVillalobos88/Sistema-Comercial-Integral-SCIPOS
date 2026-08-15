import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ModuloSeguridad } from "@scipos/backend-commons";
import { AuthModule } from "./auth/auth.module";
import { HealthController } from "./health/health.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { PrivilegiosModule } from "./privilegios/privilegios.module";
import { ProveedorPrivilegiosLocal } from "./privilegios/proveedor-privilegios-local";
import { RedisModule } from "./redis/redis.module";
import { RolesModule } from "./roles/roles.module";
import { UsuariosModule } from "./usuarios/usuarios.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    AuthModule,
    PrivilegiosModule,
    RolesModule,
    UsuariosModule,
    ModuloSeguridad.registrar({ proveedorPrivilegios: ProveedorPrivilegiosLocal }),
  ],
  controllers: [HealthController],
})
export class AppModule {}
