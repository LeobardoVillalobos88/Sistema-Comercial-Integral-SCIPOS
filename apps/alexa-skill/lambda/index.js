const http = require("http");
const https = require("https");
const { URL } = require("url");

const Alexa = require("ask-sdk-core");
const AWS = require("aws-sdk");

const {
  buscarProducto,
  describirAlertas,
  esOperacionRepetida,
  interpretarTipoRevision,
  limpiarNombreDictado,
  normalizarTexto,
  resumirBitacora,
  siguienteLote,
  validarPrecios,
} = require("./calculos-almacen");

const dynamodb = new AWS.DynamoDB.DocumentClient();

const API_URL = process.env.SCIPOS_API_URL || "http://TU_IP_PUBLICA/api";
const CORREO = process.env.SCIPOS_CORREO || "asistente@scipos.com";
const CONTRASENA = process.env.SCIPOS_CONTRASENA || "Asistente1234";

const TABLA = process.env.DYNAMODB_PERSISTENCE_TABLE_NAME;
const CLAVE_ALMACEN = "sciposAlmacen";
const CLAVE_SESION = "sciposSesion";

const VENTANA_IDEMPOTENCIA_MS = 120000;
const VIDA_TOKEN_MS = 900000;
const MARGEN_TOKEN_MS = 120000;
const TIEMPO_LIMITE_MS = 6000;

const MENU =
  "Puedes decir: registra un producto nuevo, surte inventario, " +
  "revisa las alertas del inventario, o pregúntame qué registraste hoy.";

class ErrorApi extends Error {
  constructor(estatus, mensaje) {
    super(mensaje);
    this.estatus = estatus;
  }
}

function frasePorEstatus(estatus, mensajeBackend) {
  if (estatus === 401 || estatus === 403) {
    return "No tengo permiso para hacer eso en el sistema";
  }
  if (estatus === 404) {
    return "No encontré ese registro en el sistema";
  }
  if (estatus >= 500 || estatus === 0) {
    return "El sistema no responde en este momento, tu operación no se registró";
  }
  return mensajeBackend || "El sistema rechazó la operación";
}

function responderError(handlerInput, error, respaldo) {
  console.error(error);
  const mensaje = error instanceof ErrorApi ? error.message : respaldo;
  return handlerInput.responseBuilder
    .speak(`${mensaje}. ¿Quieres intentar con otra cosa?`)
    .reprompt(MENU)
    .getResponse();
}

async function leerItem(id) {
  const { Item } = await dynamodb.get({ TableName: TABLA, Key: { id } }).promise();
  return Item || null;
}

async function guardarColumna(id, columna, valor) {
  await dynamodb
    .update({
      TableName: TABLA,
      Key: { id },
      UpdateExpression: "SET #columna = :valor",
      ExpressionAttributeNames: { "#columna": columna },
      ExpressionAttributeValues: { ":valor": valor },
    })
    .promise();
}

async function leerAlmacen() {
  const almacen = await leerItem(CLAVE_ALMACEN);
  return almacen || { data: [], folio: 0 };
}

async function registrarEnBitacora(almacen, operacion) {
  const data = [...(almacen.data || []), operacion];
  await guardarColumna(CLAVE_ALMACEN, "data", data);
}

function peticion(url, opciones) {
  const ajustes = opciones || {};
  return new Promise((resolver, rechazar) => {
    const destino = new URL(url);
    const cliente = destino.protocol === "https:" ? https : http;
    const cuerpo = ajustes.body ? JSON.stringify(ajustes.body) : null;

    const encabezados = { "Content-Type": "application/json" };
    if (ajustes.token) {
      encabezados.Authorization = `Bearer ${ajustes.token}`;
    }
    if (cuerpo) {
      encabezados["Content-Length"] = Buffer.byteLength(cuerpo);
    }

    const solicitud = cliente.request(
      {
        hostname: destino.hostname,
        port: destino.port || (destino.protocol === "https:" ? 443 : 80),
        path: destino.pathname + destino.search,
        method: ajustes.method || "GET",
        headers: encabezados,
        timeout: TIEMPO_LIMITE_MS,
      },
      (respuesta) => {
        let texto = "";
        respuesta.setEncoding("utf8");
        respuesta.on("data", (trozo) => {
          texto += trozo;
        });
        respuesta.on("end", () => {
          resolver({ estatus: respuesta.statusCode, texto });
        });
      },
    );

    solicitud.on("timeout", () => {
      solicitud.destroy(new Error(`La API tardó más de ${TIEMPO_LIMITE_MS} milisegundos`));
    });
    solicitud.on("error", rechazar);

    if (cuerpo) {
      solicitud.write(cuerpo);
    }
    solicitud.end();
  });
}

function comoJson(texto) {
  try {
    return JSON.parse(texto);
  } catch (error) {
    return null;
  }
}

async function obtenerToken() {
  const sesion = await leerItem(CLAVE_SESION);
  if (sesion && sesion.token && sesion.expiraEn - Date.now() > MARGEN_TOKEN_MS) {
    return sesion.token;
  }

  let respuesta;
  try {
    respuesta = await peticion(`${API_URL}/seguridad/auth/login`, {
      method: "POST",
      body: { correo: CORREO, contrasena: CONTRASENA },
    });
  } catch (error) {
    console.error("No se pudo alcanzar la API al iniciar sesión:", error);
    throw new ErrorApi(0, frasePorEstatus(0));
  }

  if (respuesta.estatus < 200 || respuesta.estatus >= 300) {
    console.error(`La API rechazó el inicio de sesión (${respuesta.estatus}): ${respuesta.texto}`);
    throw new ErrorApi(respuesta.estatus, "No pude iniciar sesión en el sistema");
  }

  const datos = comoJson(respuesta.texto);
  if (!datos || !datos.token) {
    console.error("El inicio de sesión no devolvió token:", respuesta.texto);
    throw new ErrorApi(0, "No pude iniciar sesión en el sistema");
  }

  await dynamodb
    .put({
      TableName: TABLA,
      Item: { id: CLAVE_SESION, token: datos.token, expiraEn: Date.now() + VIDA_TOKEN_MS },
    })
    .promise();
  return datos.token;
}

async function llamarApi(ruta, opciones) {
  const ajustes = opciones || {};
  const token = await obtenerToken();

  let respuesta;
  try {
    respuesta = await peticion(`${API_URL}${ruta}`, {
      method: ajustes.method || "GET",
      body: ajustes.body,
      token,
    });
  } catch (error) {
    console.error(`No se pudo alcanzar la API en ${ruta}:`, error);
    throw new ErrorApi(0, frasePorEstatus(0));
  }

  if (respuesta.estatus < 200 || respuesta.estatus >= 300) {
    console.error(`La API respondió ${respuesta.estatus} en ${ruta}: ${respuesta.texto}`);
    const cuerpo = comoJson(respuesta.texto);
    throw new ErrorApi(
      respuesta.estatus,
      frasePorEstatus(respuesta.estatus, cuerpo ? cuerpo.mensaje : null),
    );
  }

  return respuesta.texto ? comoJson(respuesta.texto) : null;
}

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest";
  },
  async handle(handlerInput) {
    try {
      const almacen = await leerItem(CLAVE_ALMACEN);
      if (!almacen) {
        await dynamodb
          .put({ TableName: TABLA, Item: { id: CLAVE_ALMACEN, data: [], folio: 0 } })
          .promise();
      }
    } catch (error) {
      console.error(error);
    }

    const speakOutput = `Bienvenido al asistente de almacén. ${MENU} ¿Qué necesitas?`;
    return handlerInput.responseBuilder.speak(speakOutput).reprompt(MENU).getResponse();
  },
};

const RegistrarProductoIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "RegistrarProductoIntent"
    );
  },
  async handle(handlerInput) {
    const intent = handlerInput.requestEnvelope.request.intent;

    if (intent.confirmationStatus === "DENIED") {
      return handlerInput.responseBuilder
        .speak(
          "Cancelé el registro. Si quieres intentarlo otra vez, di: registra un producto nuevo.",
        )
        .reprompt(MENU)
        .getResponse();
    }

    const nombre = limpiarNombreDictado(
      Alexa.getSlotValue(handlerInput.requestEnvelope, "nombreProducto"),
    );
    const precioCompra = Number.parseFloat(
      Alexa.getSlotValue(handlerInput.requestEnvelope, "precioCompra"),
    );
    const precioVenta = Number.parseFloat(
      Alexa.getSlotValue(handlerInput.requestEnvelope, "precioVenta"),
    );
    const fechaCaducidad = Alexa.getSlotValue(handlerInput.requestEnvelope, "fechaCaducidad");

    const errorPrecios = validarPrecios(precioCompra, precioVenta);
    if (errorPrecios) {
      return handlerInput.responseBuilder
        .speak(errorPrecios)
        .addElicitSlotDirective("precioVenta")
        .getResponse();
    }

    if (new Date(fechaCaducidad).getTime() <= Date.now()) {
      return handlerInput.responseBuilder
        .speak("Esa fecha ya pasó. ¿Cuándo caduca el lote?")
        .addElicitSlotDirective("fechaCaducidad")
        .getResponse();
    }

    try {
      const catalogo = await llamarApi("/productos/productos");
      const existente = buscarProducto(catalogo, nombre);
      if (existente) {
        return handlerInput.responseBuilder
          .speak(
            `${existente.nombre} ya está en el catálogo con ${existente.existencia} piezas. Si quieres agregarle más, di: surte inventario.`,
          )
          .reprompt(MENU)
          .getResponse();
      }

      const almacen = await leerAlmacen();
      const lote = siguienteLote(almacen.folio);

      await llamarApi("/productos/productos", {
        method: "POST",
        body: {
          lote,
          nombre,
          tipo: "PRODUCTO",
          precioCompra,
          precioVenta,
          existencia: 0,
          fechaCaducidad,
        },
      });

      await guardarColumna(CLAVE_ALMACEN, "folio", Number(almacen.folio || 0) + 1);
      await registrarEnBitacora(almacen, {
        operacionId: `registro-${Date.now()}`,
        tipo: "registro",
        huella: `registro:${normalizarTexto(nombre)}`,
        producto: nombre,
        cantidad: 0,
        importe: 0,
        resultado: lote,
        fecha: Date.now(),
      });

      return handlerInput.responseBuilder
        .speak(
          `Registré ${nombre} con lote ${lote} y precio de venta de ${precioVenta} pesos. Quedó sin existencias; para surtirlo di: surte inventario.`,
        )
        .reprompt(MENU)
        .getResponse();
    } catch (error) {
      return responderError(handlerInput, error, "No pude registrar el producto");
    }
  },
};

const SurtirInventarioIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "SurtirInventarioIntent"
    );
  },
  async handle(handlerInput) {
    const intent = handlerInput.requestEnvelope.request.intent;

    if (intent.confirmationStatus === "DENIED") {
      return handlerInput.responseBuilder
        .speak(
          "Cancelé la entrada de inventario. Si quieres intentarlo otra vez, di: surte inventario.",
        )
        .reprompt(MENU)
        .getResponse();
    }

    const nombre = Alexa.getSlotValue(handlerInput.requestEnvelope, "producto");
    const cantidad = Number.parseInt(
      Alexa.getSlotValue(handlerInput.requestEnvelope, "cantidad"),
      10,
    );
    const proveedor = limpiarNombreDictado(
      Alexa.getSlotValue(handlerInput.requestEnvelope, "proveedor"),
    );

    try {
      const almacen = await leerAlmacen();
      const huella = `surtir:${normalizarTexto(nombre)}:${cantidad}`;
      const repetida = esOperacionRepetida(
        almacen.data,
        huella,
        Date.now(),
        VENTANA_IDEMPOTENCIA_MS,
      );

      if (repetida) {
        return handlerInput.responseBuilder
          .speak(`Esa entrada ya la registré hace un momento. ${repetida.resultado}`)
          .reprompt(MENU)
          .getResponse();
      }

      const catalogo = await llamarApi("/productos/productos");
      const producto = buscarProducto(catalogo, nombre);
      if (!producto) {
        return handlerInput.responseBuilder
          .speak(
            `No encontré ${nombre} en el catálogo. Si es nuevo, di: registra un producto nuevo.`,
          )
          .reprompt(MENU)
          .getResponse();
      }

      await llamarApi("/productos/compras", {
        method: "POST",
        body: {
          proveedor,
          partidas: [{ productoId: producto.id, cantidad }],
        },
      });

      const existenciaFinal = producto.existencia + cantidad;
      const resultado = `${producto.nombre} quedó con ${existenciaFinal} piezas.`;

      await registrarEnBitacora(almacen, {
        operacionId: `entrada-${Date.now()}`,
        tipo: "entrada",
        huella,
        producto: producto.nombre,
        cantidad,
        importe: cantidad * producto.precioCompra,
        resultado,
        fecha: Date.now(),
      });

      return handlerInput.responseBuilder
        .speak(
          `Entraron ${cantidad} piezas de ${producto.nombre}. Ahora tienes ${existenciaFinal}.`,
        )
        .reprompt(MENU)
        .getResponse();
    } catch (error) {
      return responderError(handlerInput, error, "No pude registrar la entrada de inventario");
    }
  },
};

const RevisarInventarioIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "RevisarInventarioIntent"
    );
  },
  async handle(handlerInput) {
    const tipoRevision = Alexa.getSlotValue(handlerInput.requestEnvelope, "tipoRevision") || "todo";

    try {
      const alertas = await llamarApi("/productos/productos/alertas");
      return handlerInput.responseBuilder
        .speak(describirAlertas(alertas, interpretarTipoRevision(tipoRevision)))
        .reprompt(MENU)
        .getResponse();
    } catch (error) {
      return responderError(handlerInput, error, "No pude consultar el inventario");
    }
  },
};

const BitacoraVozIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "BitacoraVozIntent"
    );
  },
  async handle(handlerInput) {
    try {
      const almacen = await leerAlmacen();
      const resumen = resumirBitacora(almacen.data, Date.now());

      if (resumen.total === 0) {
        return handlerInput.responseBuilder
          .speak(`Hoy todavía no has registrado nada por voz. ${MENU}`)
          .reprompt(MENU)
          .getResponse();
      }

      const partes = [];
      if (resumen.productos > 0) {
        partes.push(
          `${resumen.productos} ${resumen.productos === 1 ? "producto nuevo" : "productos nuevos"}`,
        );
      }
      if (resumen.entradas > 0) {
        partes.push(
          `${resumen.entradas} ${resumen.entradas === 1 ? "entrada" : "entradas"} de inventario ` +
            `por ${resumen.importe} pesos`,
        );
      }

      return handlerInput.responseBuilder
        .speak(
          `Hoy por voz registraste ${partes.join(" y ")}. ` +
            `Lo último fue ${resumen.ultima.producto}.`,
        )
        .reprompt(MENU)
        .getResponse();
    } catch (error) {
      return responderError(handlerInput, error, "No pude leer la bitácora");
    }
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    const speakOutput = `Soy el asistente de almacén de SCIPOS. Puedo dar de alta productos en el catálogo, registrar la mercancía que te llega, avisarte qué está por caducar o por agotarse, y decirte qué llevas registrado hoy. ${MENU}`;
    return handlerInput.responseBuilder.speak(speakOutput).reprompt(MENU).getResponse();
  },
};

const NavigateHomeIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.NavigateHomeIntent"
    );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(`Volvamos al principio. ${MENU}`)
      .reprompt(MENU)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    const nombre = Alexa.getIntentName(handlerInput.requestEnvelope);
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      (nombre === "AMAZON.CancelIntent" || nombre === "AMAZON.StopIntent")
    );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.speak("Hasta luego.").getResponse();
  },
};

const FallbackIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.FallbackIntent"
    );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(`No entendí eso. ${MENU}`)
      .reprompt(MENU)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === "SessionEndedRequest";
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.getResponse();
  },
};

const IntentReflectorHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest";
  },
  handle(handlerInput) {
    const nombre = Alexa.getIntentName(handlerInput.requestEnvelope);
    return handlerInput.responseBuilder
      .speak(`Todavía no sé atender ${nombre}. ${MENU}`)
      .reprompt(MENU)
      .getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.error(error);
    return handlerInput.responseBuilder
      .speak(`Tuve un problema con lo que me pediste. ${MENU}`)
      .reprompt(MENU)
      .getResponse();
  },
};

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    RegistrarProductoIntentHandler,
    SurtirInventarioIntentHandler,
    RevisarInventarioIntentHandler,
    BitacoraVozIntentHandler,
    HelpIntentHandler,
    NavigateHomeIntentHandler,
    CancelAndStopIntentHandler,
    FallbackIntentHandler,
    SessionEndedRequestHandler,
    IntentReflectorHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
