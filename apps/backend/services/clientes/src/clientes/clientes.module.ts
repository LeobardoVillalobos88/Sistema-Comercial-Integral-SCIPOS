import { Module } from "@nestjs/common";
import { ClienteHttp } from "@scipos/backend-commons";
import { ClientesController } from "./clientes.controller";
import { ClientesService } from "./clientes.service";

@Module({
  controllers: [ClientesController],
  providers: [ClientesService, ClienteHttp],
})
export class ClientesModule {}
