import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";

interface RespuestaDeError {
  estatus: number;
  mensaje: string | string[];
  error: string;
  ruta: string;
  fecha: string;
}

/**
 * Filtro global de excepciones. Da a todos los servicios el mismo formato de
 * error, con el mensaje en `mensaje` (es lo que muestran los toasts del
 * frontend).
 *
 * Registrarlo en el main.ts de cada servicio:
 *   app.useGlobalFilters(new FiltroExcepcionesHttp());
 */
@Catch()
export class FiltroExcepcionesHttp implements ExceptionFilter {
  private readonly logger = new Logger(FiltroExcepcionesHttp.name);

  catch(excepcion: unknown, host: ArgumentsHost): void {
    const contexto = host.switchToHttp();
    const respuesta = contexto.getResponse<{
      status: (codigo: number) => { json: (cuerpo: RespuestaDeError) => void };
    }>();
    const peticion = contexto.getRequest<{ url?: string }>();

    let estatus: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let mensaje: string | string[] = "Error interno del servidor.";
    let error = "Error interno";

    if (excepcion instanceof HttpException) {
      estatus = excepcion.getStatus();
      const cuerpo = excepcion.getResponse();
      if (typeof cuerpo === "string") {
        mensaje = cuerpo;
        error = excepcion.name;
      } else {
        const detalles = cuerpo as { message?: string | string[]; error?: string };
        mensaje = detalles.message ?? excepcion.message;
        error = detalles.error ?? excepcion.name;
      }
    } else {
      this.logger.error(excepcion instanceof Error ? excepcion.stack : String(excepcion));
    }

    respuesta.status(estatus).json({
      estatus,
      mensaje,
      error,
      ruta: peticion.url ?? "",
      fecha: new Date().toISOString(),
    });
  }
}
