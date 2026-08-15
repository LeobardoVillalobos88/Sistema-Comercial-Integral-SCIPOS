import { Module } from "@nestjs/common";
import { ClienteHttp } from "@scipos/backend-commons";
import { ReportesController } from "./reportes.controller";
import { ReportesService } from "./reportes.service";

@Module({
  controllers: [ReportesController],
  providers: [ReportesService, ClienteHttp],
})
export class ReportesModule {}
