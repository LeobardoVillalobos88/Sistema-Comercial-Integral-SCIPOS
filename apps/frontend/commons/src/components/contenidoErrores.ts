/**
 * Texto de cada pantalla de error, en un solo lugar: la ruta navegable y el
 * armazón que la muestra sola deben decir exactamente lo mismo.
 *
 * Dos renglones por error. Lo suficiente para orientar a quien solo quiere
 * volver a trabajar, sin lenguaje de máquina ni sermón.
 */

export type CodigoError = 401 | 403 | 404 | 500 | 503;

export interface ContenidoError {
  titulo: string;
  descripcion: string;
}

export const CONTENIDO_ERROR: Record<CodigoError, ContenidoError> = {
  401: {
    titulo: "Tu sesión terminó",
    descripcion:
      "Por seguridad cerramos las sesiones tras un rato sin actividad. No perdiste nada de " +
      "lo que ya guardaste: vuelve a entrar y sigues donde estabas.",
  },
  403: {
    titulo: "Aquí no tienes acceso",
    descripcion:
      "Esta pantalla existe, pero tu cuenta no tiene el permiso que necesita. Si lo " +
      "requieres para tu trabajo, un administrador puede concedértelo desde Usuarios.",
  },
  404: {
    titulo: "Esta página no existe",
    descripcion:
      "La dirección que abriste no corresponde a ninguna pantalla del sistema. Suele ser " +
      "un enlace viejo o una letra de más en la barra de direcciones.",
  },
  500: {
    titulo: "Algo se rompió de nuestro lado",
    descripcion:
      "El sistema falló al preparar esta pantalla; no fue algo que hicieras mal y tu " +
      "información está a salvo. Intenta de nuevo en unos segundos.",
  },
  503: {
    titulo: "El sistema no responde",
    descripcion:
      "La aplicación no logra comunicarse con el servidor de datos, casi siempre por algo " +
      "pasajero. Espera un momento y reintenta; no registres nada todavía.",
  },
};
