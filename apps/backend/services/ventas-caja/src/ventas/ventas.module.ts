import { Module } from "@nestjs/common";
import { ClienteHttp } from "@scipos/backend-commons";
import { CajaModule } from "../caja/caja.module";
import { ComprobantesService } from "./comprobantes.service";
import { VentasController } from "./ventas.controller";
import { VentasService } from "./ventas.service";

@Module({
  imports: [CajaModule],
  controllers: [VentasController],
  providers: [VentasService, ComprobantesService, ClienteHttp],
})
export class VentasModule {}
