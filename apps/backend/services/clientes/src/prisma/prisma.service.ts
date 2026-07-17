import { Injectable, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from ".prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService) {
    const url = config.getOrThrow<string>("DATABASE_URL");
    // El adapter de pg no lee el parámetro ?schema= de la URL; hay que pasarlo aparte.
    const schema = new URL(url).searchParams.get("schema") ?? undefined;
    const adapter = new PrismaPg({ connectionString: url }, schema ? { schema } : undefined);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
