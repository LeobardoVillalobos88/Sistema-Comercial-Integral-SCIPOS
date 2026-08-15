import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";
import { FiltroExcepcionesHttp, crearLogger } from "@scipos/backend-commons";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = crearLogger("seguridad-service");
  const puerto = process.env.PORT ?? 4001;

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new FiltroExcepcionesHttp());

  const config = new DocumentBuilder()
    .setTitle("SCIPOS - Servicio de Seguridad")
    .setDescription(
      "Usuarios, roles y privilegios dinámicos por módulo y acción. " +
        "Las peticiones protegidas identifican al usuario con el header x-usuario-id.",
    )
    .setVersion("1.0")
    .build();

  type AppNest = Parameters<typeof SwaggerModule.createDocument>[0];
  const appNest = app as AppNest;
  const documento = SwaggerModule.createDocument(appNest, config);
  SwaggerModule.setup("api", appNest, documento);
  app.use("/docs", apiReference({ content: documento }));

  await app.listen(puerto);
  logger.log(`Servicio de seguridad escuchando en http://localhost:${puerto}`);
  logger.log(`Documentación Scalar en http://localhost:${puerto}/docs`);
  logger.log(`OpenAPI JSON en http://localhost:${puerto}/api-json`);
}
bootstrap();
