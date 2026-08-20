/**
 * Asistente de almacén: skill de Alexa que opera el inventario de SCIPOS.
 *
 * Cuatro acciones, cada una con un recorrido distinto por la persistencia:
 *   RegistrarProducto  -> API (consulta) -> API (crea) -> Dynamo (folio y bitácora)
 *   SurtirInventario   -> Dynamo (idempotencia) -> API (compra) -> Dynamo (bitácora)
 *   RevisarInventario  -> solo API
 *   BitacoraVoz        -> solo Dynamo
 *
 * La skill no calcula precios ni existencias: eso lo hace el backend. Aquí solo
 * se traduce voz a llamadas y respuestas a frases.
 */
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
  normalizarTexto,
  resumirBitacora,
  siguienteLote,
  validarPrecios,
} = require("./calculos-almacen");

const dynamodb = new AWS.DynamoDB.DocumentClient();

// --------------------------------------------------------------------------
// Conexión con la API de SCIPOS
//
// Las skills alojadas por Alexa no tienen editor de variables de entorno: eso
// solo existe cuando el Lambda vive en una cuenta propia de AWS. Por eso los
// valores están aquí, y se leen primero del entorno para que mover la skill a
// un Lambda propio no obligue a tocar el código.
//
// El respaldo se resuelve con || y no con ??, igual que en la semilla del
// backend: una variable declarada y vacía debe caer al valor de abajo en vez
// de darse por buena.
//
// Al pegar el archivo en la consola hay que cambiar la IP por la de la
// instancia donde corre el sistema. La URL termina en /api y no lleva barra
// final ni puerto: nginx sirve la API bajo esa ruta en el puerto 80.
// --------------------------------------------------------------------------
const API_URL = process.env.SCIPOS_API_URL || "http://TU_IP_PUBLICA/api";
const CORREO = process.env.SCIPOS_CORREO || "asistente@scipos.com";
const CONTRASENA = process.env.SCIPOS_CONTRASENA || "Asistente1234";

// Esta sí la inyecta Alexa-hosted por su cuenta; no hay que declararla.
const TABLA = process.env.DYNAMODB_PERSISTENCE_TABLE_NAME;
const CLAVE_ALMACEN = "sciposAlmacen";
const CLAVE_SESION = "sciposSesion";

/** Ventana en la que repetir la misma frase se considera un doble dictado. */
const VENTANA_IDEMPOTENCIA_MS = 120000;
/** El access token dura 15 minutos; se renueva con dos de margen. */
const VIDA_TOKEN_MS = 900000;
const MARGEN_TOKEN_MS = 120000;
/** Corta la espera antes de que el Lambda agote su propio tiempo. */
const TIEMPO_LIMITE_MS = 6000;

const MENU =
  "Puedes decir: registra un producto nuevo, surte inventario, " +
  "revisa las alertas del inventario, o pregúntame qué registraste hoy.";

// --------------------------------------------------------------------------
// Errores de la API
// --------------------------------------------------------------------------

/** Error de la API con el mensaje ya listo para decirse en voz alta. */
class ErrorApi extends Error {
  constructor(estatus, mensaje) {
    super(mensaje);
    this.estatus = estatus;
  }
}

/** Traduce un código HTTP a una frase útil, nunca a un error crudo. */
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

/** Frase de cierre ante cualquier fallo, sin cerrar la sesión. */
function responderError(handlerInput, error, respaldo) {
  console.error(error);
  const mensaje = error instanceof ErrorApi ? error.message : respaldo;
  return handlerInput.responseBuilder
    .speak(`${mensaje}. ¿Quieres intentar con otra cosa?`)
    .reprompt(MENU)
    .getResponse();
}

// --------------------------------------------------------------------------
// DynamoDB
// --------------------------------------------------------------------------

/** Lee un item de la tabla; devuelve null si no existe todavía. */
async function leerItem(id) {
  const { Item } = await dynamodb.get({ TableName: TABLA, Key: { id } }).promise();
  return Item || null;
}

/** Escribe una columna del item, dejando el resto intacto. */
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

/** Devuelve el item del almacén, con sus valores iniciales si aún no existe. */
async function leerAlmacen() {
  const almacen = await leerItem(CLAVE_ALMACEN);
  return almacen || { data: [], folio: 0 };
}

/** Agrega una operación a la bitácora de voz. */
async function registrarEnBitacora(almacen, operacion) {
  const data = [...(almacen.data || []), operacion];
  await guardarColumna(CLAVE_ALMACEN, "data", data);
}

// --------------------------------------------------------------------------
// API de SCIPOS
// --------------------------------------------------------------------------

/**
 * Petición HTTP con los módulos nativos de Node.
 *
 * No se usa `fetch` porque solo existe como global desde Node 18, y el runtime
 * de las skills alojadas por Alexa puede ser anterior; cuando falta, la llamada
 * revienta con "fetch is not defined" y desde la conversación se ve idéntico a
 * que el servidor no hubiera respondido. Lo mismo vale para
 * `AbortSignal.timeout`, que necesita Node 17.3. Con `http` y `https` no hay
 * versión que valga: existen desde siempre.
 *
 * Devuelve el estatus y el cuerpo sin interpretar; quien llama decide.
 */
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

/** Interpreta el cuerpo como JSON sin reventar si resultó no serlo. */
function comoJson(texto) {
  try {
    return JSON.parse(texto);
  } catch (error) {
    return null;
  }
}

/**
 * Devuelve un token vigente de la API. Reutiliza el guardado en Dynamo mientras
 * le queden más de dos minutos de vida; si no, inicia sesión de nuevo. Evita un
 * inicio de sesión por cada frase que dice la persona.
 */
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
    // Registrar aquí no es opcional: sin esto, un corte de red, una URL mal
    // escrita y una función ausente en el runtime producen la misma frase y no
    // hay forma de distinguirlas desde fuera.
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

/**
 * Llama a la API propagando el token. El backend responde sus errores con la
 * forma { estatus, mensaje, error, ruta, fecha }, y el mensaje ya viene en
 * español y escrito para personas, así que se aprovecha tal cual.
 */
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

// --------------------------------------------------------------------------
// Handlers
// --------------------------------------------------------------------------

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest";
  },
  async handle(handlerInput) {
    // El item se crea solo si falta. Sobrescribirlo en cada arranque borraría
    // la bitácora de operaciones que la skill ya registró.
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

/** Alta al catálogo. Recorrido: API (consulta) -> API (crea) -> Dynamo. */
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

    const nombre = Alexa.getSlotValue(handlerInput.requestEnvelope, "nombreProducto");
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
      // El duplicado se busca contra el catálogo, que es la fuente de verdad:
      // el producto pudo haberse capturado desde la interfaz web.
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

/** Entrada de mercancía. Recorrido: Dynamo -> API -> Dynamo. */
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
    const proveedor = Alexa.getSlotValue(handlerInput.requestEnvelope, "proveedor");

    try {
      // Dynamo va primero a propósito: si la frase se repitió, hay que cortar
      // antes de llamar a la API. Surtir dos veces deja piezas que no existen
      // en el anaquel, y eso no se nota hasta el siguiente conteo físico.
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

      // El precio no viaja en la petición: el servicio usa el precio de compra
      // vigente del producto, así el importe no depende de lo que mande la voz.
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

/** Alertas de caducidad y existencias. Recorrido: solo API. */
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

/** Resumen de lo dictado hoy. Recorrido: solo Dynamo. */
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

/** Atrapa cualquier intent sin handler propio; útil al depurar el modelo. */
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

// El orden importa: se procesan de arriba abajo y el reflector atrapa todo.
exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    RegistrarProductoIntentHandler,
    SurtirInventarioIntentHandler,
    RevisarInventarioIntentHandler,
    BitacoraVozIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    FallbackIntentHandler,
    SessionEndedRequestHandler,
    IntentReflectorHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
