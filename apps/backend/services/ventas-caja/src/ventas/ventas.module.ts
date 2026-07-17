import { Module } from "@nestjs/common";
import { ClienteHttp } from "@scipos/backend-commons";
import { CajaModule } from "../caja/caja.module";
import { VentasController } from "./ventas.controller";
import { VentasService } from "./ventas.service";

@Module({
  imports: [CajaModule],
  controllers: [VentasController],
  providers: [VentasService, ClienteHttp],
})
export class VentasModule {}
