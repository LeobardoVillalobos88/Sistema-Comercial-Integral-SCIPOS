/**
 * Reglas puras del asistente de almacén. No conoce Alexa, ni Dynamo, ni la API:
 * recibe datos y devuelve datos, para poder probarlas sin levantar nada.
 */

/**
 * Acentos que NFD deja sueltos. Se arma con escapes en texto y no como literal:
 * el editor de la consola no lee `\p{...}` y los combinantes no sobreviven al pegar.
 */
const ACENTOS_SUELTOS = new RegExp("[\\u0300-\\u036f]", "g");

/** Redondea a dos decimales, que es la precisión con la que se habla de dinero. */
function redondear(valor) {
  return Math.round(valor * 100) / 100;
}

/**
 * Deja un texto comparable: sin acentos, en minúsculas y con un espacio entre
 * palabras. "Papel  Higiénico" y "Papel higiénico 4 rollos" no se parecen sin esto.
 */
function normalizarTexto(texto) {
  if (texto === null || texto === undefined) return "";
  return String(texto)
    .normalize("NFD")
    .replace(ACENTOS_SUELTOS, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Busca un producto por el nombre dictado. Primero exige coincidencia exacta y
 * solo después acepta parcial: si no, "leche" ganaría sobre el producto "Leche".
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

/** Siguiente clave de lote: dictarla en voz alta sería una tortura. */
function siguienteLote(folio) {
  const numero = Number(folio || 0) + 1;
  return `VOZ-${String(numero).padStart(3, "0")}`;
}

/**
 * Busca una operación idéntica hecha hace muy poco, para que repetir una frase
 * no duplique el efecto: surtir dos veces deja piezas que no están en el anaquel.
 */
function esOperacionRepetida(operaciones, huella, ahoraMs, ventanaMs) {
  const bitacora = operaciones || [];
  const repetida = bitacora.find(
    (operacion) => operacion.huella === huella && ahoraMs - operacion.fecha < ventanaMs,
  );
  return repetida || null;
}

/** Resume lo dictado hoy. Solo el día en curso: responde "qué llevo hecho hoy". */
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
 * precios, así que la regla vive aquí: vender bajo costo suele ser un mal dictado.
 */
function validarPrecios(precioCompra, precioVenta) {
  if (precioVenta > precioCompra) return null;
  return `El precio de venta debe ser mayor al de compra, que es de ${precioCompra} pesos. ¿En cuánto lo vendes?`;
}

/**
 * Traduce lo dicho al grupo de alertas. El slot entrega la frase escuchada y no
 * el valor canónico: quien dice "vencimientos" no recibe "caducidad".
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
 * Resume las alertas para escucharlas de corrido: el caso más urgente y no la
 * lista completa, que dictada entera sería inservible.
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
