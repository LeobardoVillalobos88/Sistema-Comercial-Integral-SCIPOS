import { Global, Module } from "@nestjs/common";
import { PrivilegiosController } from "./privilegios.controller";
import { PrivilegiosService } from "./privilegios.service";
import { ProveedorPrivilegiosLocal } from "./proveedor-privilegios-local";

/**
 * Módulo de privilegios. Es global porque el guard de privilegios (registrado
 * por ModuloSeguridad) resuelve las verificaciones con el proveedor local,
 * que a su vez depende de PrivilegiosService.
 */
@Global()
@Module({
  controllers: [PrivilegiosController],
  providers: [PrivilegiosService, ProveedorPrivilegiosLocal],
  exports: [PrivilegiosService],
})
export class PrivilegiosModule {}
