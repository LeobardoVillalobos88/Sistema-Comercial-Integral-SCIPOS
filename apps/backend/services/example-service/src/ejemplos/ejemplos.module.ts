import { Module } from "@nestjs/common";
import { EjemplosController } from "./ejemplos.controller";
import { EjemplosService } from "./ejemplos.service";

@Module({
  controllers: [EjemplosController],
  providers: [EjemplosService],
})
export class EjemplosModule {}
