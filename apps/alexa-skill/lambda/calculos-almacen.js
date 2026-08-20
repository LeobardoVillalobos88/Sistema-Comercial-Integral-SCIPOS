/**
 * Reglas puras del asistente de almacén: búsqueda de productos por voz, folio
 * de lote, idempotencia, resumen de la bitácora y redacción de las alertas.
 *
 * No conoce Alexa, ni DynamoDB, ni la API. Recibe datos y devuelve datos, para
 * que las reglas que importan se puedan probar sin levantar nada.
 */

/** Redondea a dos decimales, que es la precisión con la que se habla de dinero. */
function redondear(valor) {
  return Math.round(valor * 100) / 100;
}

/**
 * Deja un texto comparable: sin acentos, en minúsculas y con un solo espacio
 * entre palabras. El reconocimiento de voz entrega "Papel  Higiénico" y el
 * catálogo guarda "Papel higiénico 4 rollos"; sin normalizar no se parecen.
 *
 * NFD separa cada letra de su acento y \p{Diacritic} borra los acentos sueltos.
 * Se usa esa propiedad y no un rango literal porque este archivo se copia y se
 * pega en la consola: unos caracteres combinantes invisibles no sobreviven bien.
 *
 * La comprobación de nulos se escribe larga en vez de con ??, porque el editor
 * de la consola de Alexa marca esa sintaxis como error y confunde a quien pega
 * el archivo.
 */
function normalizarTexto(texto) {
  if (texto === null || texto === undefined) return "";
  return String(texto)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Busca un producto del catálogo por el nombre que dictó la persona.
 *
 * Va en dos pasadas: primero exige que el nombre coincida completo y solo si
 * ninguno coincide acepta una coincidencia parcial. Al revés, dictar "leche"
 * podría devolver "leche entera deslactosada" aunque exista un producto que se
 * llame exactamente "leche".
 */
function buscarProducto(productos, nombre) {
  const buscado = normalizarTexto(nombre);
  if (!buscado) return null;

  const catalogo = productos || [];
  const exacto = catalogo.find((producto) => normalizarTexto(producto.nombre) === buscado);
  if (exacto) return exacto;

  const parcial = catalogo.find((producto) => {
    const candidato = normalizarTexto(producto.nombre);
    return candidato.includes(buscado) || buscado.includes(candidato);
  });
  return parcial || null;
}

/**
 * Siguiente clave de lote para un alta por voz. Dictar una clave como
 * "abarrote guion cero cero uno" es una tortura, así que la skill la genera.
 */
function siguienteLote(folio) {
  const numero = Number(folio || 0) + 1;
  return `VOZ-${String(numero).padStart(3, "0")}`;
}

/**
 * Busca en la bitácora una operación idéntica hecha hace muy poco.
 *
 * Sirve para que repetir una frase no duplique el efecto: si el reconocimiento
 * falla y la persona vuelve a dictar la misma entrada de inventario, surtir dos
 * veces dejaría piezas que no existen en el anaquel.
 */
function esOperacionRepetida(operaciones, huella, ahoraMs, ventanaMs) {
  const bitacora = operaciones || [];
  const repetida = bitacora.find(
    (operacion) => operacion.huella === huella && ahoraMs - operacion.fecha < ventanaMs,
  );
  return repetida || null;
}

/**
 * Resume lo que se dictó hoy: cuántas altas, cuántas entradas, cuánto dinero
 * representan y cuál fue la última. Solo cuenta el día en curso, porque la
 * pregunta que responde es "qué llevo hecho hoy".
 */
function resumirBitacora(operaciones, ahoraMs) {
  const hoy = new Date(ahoraMs).toDateString();
  const delDia = (operaciones || []).filter(
    (operacion) => new Date(operacion.fecha).toDateString() === hoy,
  );

  const ultima = delDia.reduce(
    (masReciente, operacion) =>
      masReciente === null || operacion.fecha > masReciente.fecha ? operacion : masReciente,
    null,
  );

  return {
    total: delDia.length,
    productos: delDia.filter((operacion) => operacion.tipo === "registro").length,
    entradas: delDia.filter((operacion) => operacion.tipo === "entrada").length,
    importe: redondear(delDia.reduce((suma, operacion) => suma + (operacion.importe || 0), 0)),
    ultima,
  };
}

/**
 * Revisa que el producto deje margen. El catálogo acepta cualquier par de
 * precios, así que esta regla vive aquí: dar de alta algo que se vende más
 * barato de lo que cuesta casi siempre es un error de dictado.
 */
function validarPrecios(precioCompra, precioVenta) {
  if (precioVenta > precioCompra) return null;
  return `El precio de venta debe ser mayor al de compra, que es de ${precioCompra} pesos. ¿En cuánto lo vendes?`;
}

/**
 * Traduce lo que dijo la persona al grupo de alertas que quiere revisar.
 *
 * Hace falta porque el slot entrega la frase tal como se escuchó y no el valor
 * canónico del tipo: quien dice "vencimientos" recibe "vencimientos", no
 * "caducidad". Compararlo contra el valor exacto dejaría fuera a los sinónimos.
 */
function interpretarTipoRevision(valor) {
  const dicho = normalizarTexto(valor);
  if (/caduc|venc|fecha/.test(dicho)) return "caducidad";
  if (/exist|stock|acab|agot|pieza|bajo/.test(dicho)) return "existencias";
  return "todo";
}

/** Cómo se dice cuántos días le quedan a un lote. */
function frasePlazo(diasRestantes) {
  if (diasRestantes < 0) {
    const dias = Math.abs(diasRestantes);
    return `venció hace ${dias} ${dias === 1 ? "día" : "días"}`;
  }
  if (diasRestantes === 0) return "vence hoy";
  return `vence en ${diasRestantes} ${diasRestantes === 1 ? "día" : "días"}`;
}

/** Frase del grupo de caducidad, o el aviso de que ese grupo está limpio. */
function fraseCaducidad(caducidad) {
  if (caducidad.length === 0) return "No tienes lotes por caducar.";

  const vencidos = caducidad.filter((alerta) => alerta.severidad === "VENCIDO").length;
  const porVencer = caducidad.length - vencidos;
  const urgente = caducidad[0];

  const partes = [];
  if (vencidos > 0)
    partes.push(`${vencidos} ${vencidos === 1 ? "lote vencido" : "lotes vencidos"}`);
  if (porVencer > 0) partes.push(`${porVencer} por vencer`);

  return `Tienes ${partes.join(" y ")}. El más urgente es ${urgente.nombre}, que ${frasePlazo(urgente.diasRestantes)}.`;
}

/** Frase del grupo de existencias, o el aviso de que ese grupo está limpio. */
function fraseStock(stock) {
  if (stock.length === 0) return "No tienes productos agotados ni por agotarse.";

  const agotados = stock.filter((alerta) => alerta.severidad === "AGOTADO").length;
  const bajos = stock.length - agotados;
  const urgente = stock[0];

  const partes = [];
  if (agotados > 0)
    partes.push(`${agotados} ${agotados === 1 ? "producto agotado" : "productos agotados"}`);
  if (bajos > 0) partes.push(`${bajos} con existencias bajas`);

  const estado = urgente.severidad === "AGOTADO" ? "está en cero" : `tiene ${urgente.existencia}`;
  return `Tienes ${partes.join(" y ")}. El más urgente es ${urgente.nombre}, que ${estado}.`;
}

/**
 * Convierte las alertas del inventario en algo que se pueda escuchar de
 * corrido. Se leen resúmenes con el caso más urgente y no la lista completa:
 * veinte productos dictados uno por uno son inservibles por voz.
 */
function describirAlertas(alertas, tipoRevision) {
  if (!alertas || alertas.total === 0) {
    return "El inventario está sin alertas: nada vencido y nada por agotarse.";
  }

  const caducidad = alertas.caducidad || [];
  const stock = alertas.stock || [];

  if (tipoRevision === "caducidad") return fraseCaducidad(caducidad);
  if (tipoRevision === "existencias") return fraseStock(stock);
  return `${fraseCaducidad(caducidad)} ${fraseStock(stock)}`;
}

module.exports = {
  buscarProducto,
  describirAlertas,
  esOperacionRepetida,
  interpretarTipoRevision,
  normalizarTexto,
  resumirBitacora,
  siguienteLote,
  validarPrecios,
};
