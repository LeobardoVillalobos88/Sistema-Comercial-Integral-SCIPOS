import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { PrismaService } from "../prisma/prisma.service";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "Health check del servicio y PostgreSQL" })
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: "ok", service: "cotizaciones-service", database: "ok" };
  }
}
