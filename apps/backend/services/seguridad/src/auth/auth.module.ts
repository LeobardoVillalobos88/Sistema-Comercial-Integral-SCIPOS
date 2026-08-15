import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { FirmadorToken } from "./firmador-token";
import { JwksController } from "./jwks.controller";

@Module({
  controllers: [AuthController, JwksController],
  providers: [AuthService, FirmadorToken],
})
export class AuthModule {}
