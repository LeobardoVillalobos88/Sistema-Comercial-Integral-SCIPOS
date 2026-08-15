import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";
import { FiltroExcepcionesHttp, HEADER_USUARIO_ID, crearLogger } from "@scipos/backend-commons";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = crearLogger("cotizaciones-service");
  const puerto = process.env.PORT ?? 4004;

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalFilters(new FiltroExcepcionesHttp());

  const config = new DocumentBuilder()
    .setTitle("SCIPOS - Servicio de Cotizaciones")
    .setDescription(
      `Cotizaciones, folios, ciclo de vida y conversión a venta. La identidad se recibe en el header ${HEADER_USUARIO_ID}.`,
    )
    .setVersion("1.0")
    .addApiKey({ type: "apiKey", in: "header", name: HEADER_USUARIO_ID }, "usuario")
    .build();

  type AppNest = Parameters<typeof SwaggerModule.createDocument>[0];
  const appNest = app as AppNest;
  const documento = SwaggerModule.createDocument(appNest, config);
  SwaggerModule.setup("api", appNest, documento);
  app.use("/docs", apiReference({ content: documento }));

  await app.listen(puerto);
  logger.log(`Servicio de cotizaciones escuchando en http://localhost:${puerto}`);
  logger.log(`Documentación Scalar en http://localhost:${puerto}/docs`);
  logger.log(`OpenAPI JSON en http://localhost:${puerto}/api-json`);
}

bootstrap();
