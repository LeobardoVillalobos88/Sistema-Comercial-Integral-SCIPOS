import { Global, Module } from "@nestjs/common";
import { PrivilegiosController } from "./privilegios.controller";
import { PrivilegiosService } from "./privilegios.service";
import { ProveedorPrivilegiosLocal } from "./proveedor-privilegios-local";

@Global()
@Module({
  controllers: [PrivilegiosController],
  providers: [PrivilegiosService, ProveedorPrivilegiosLocal],
  exports: [PrivilegiosService],
})
export class PrivilegiosModule {}
