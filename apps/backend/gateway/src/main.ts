import { NestFactory } from "@nestjs/core";
import { HEADER_USUARIO_ID, crearLogger } from "@scipos/backend-commons";
import { createProxyMiddleware } from "http-proxy-middleware";
import { AppModule } from "./app.module";
import { crearMiddlewareJwt } from "./auth/jwt-edge.middleware";
import { origenesPermitidos, serviciosEnrutados } from "./config/servicios";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = crearLogger("gateway");
  const puerto = process.env.PORT ?? 4000;

  app.enableCors({
    origin: origenesPermitidos(),
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.use("/api", crearMiddlewareJwt());

  for (const servicio of serviciosEnrutados()) {
    app.use(
      `/api/${servicio.ruta}`,
      createProxyMiddleware({
        target: servicio.url,
        changeOrigin: true,
        on: {
          proxyReq: (peticionProxy) => {
            peticionProxy.removeHeader(HEADER_USUARIO_ID);
          },
          error: (_error, _peticion, respuesta) => {
            const res = respuesta as {
              headersSent?: boolean;
              writeHead?: (codigo: number, cabeceras: Record<string, string>) => void;
              end?: (cuerpo: string) => void;
            };
            if (res.writeHead && res.end && !res.headersSent) {
              res.writeHead(502, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  estatus: 502,
                  mensaje: `El servicio "${servicio.ruta}" no está disponible.`,
                  error: "Servicio no disponible",
                }),
              );
            }
          },
        },
      }),
    );
  }

  await app.listen(puerto);
  logger.log(`Gateway escuchando en http://localhost:${puerto}`);
  for (const servicio of serviciosEnrutados()) {
    logger.log(`  /api/${servicio.ruta} -> ${servicio.url}`);
  }
}
bootstrap();
