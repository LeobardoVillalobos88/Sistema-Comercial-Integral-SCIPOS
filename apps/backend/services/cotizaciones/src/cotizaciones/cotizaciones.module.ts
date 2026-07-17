import { Module } from "@nestjs/common";

import { IntegracionesModule } from "../integraciones/integraciones.module";
import { CotizacionesController } from "./cotizaciones.controller";
import { CotizacionesService } from "./cotizaciones.service";

@Module({
  imports: [IntegracionesModule],
  controllers: [CotizacionesController],
  providers: [CotizacionesService],
})
export class CotizacionesModule {}
