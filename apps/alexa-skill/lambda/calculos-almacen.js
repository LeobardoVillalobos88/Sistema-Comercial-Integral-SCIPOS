const ACENTOS_SUELTOS = new RegExp("[\\u0300-\\u036f]", "g");

function redondear(valor) {
  return Math.round(valor * 100) / 100;
}

function normalizarTexto(texto) {
  if (texto === null || texto === undefined) return "";
  return String(texto)
    .normalize("NFD")
    .replace(ACENTOS_SUELTOS, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

const MULETILLAS = [
  "el",
  "la",
  "los",
  "las",
  "un",
  "una",
  "unos",
  "unas",
  "es",
  "son",
  "mi",
  "mis",
];

function limpiarNombreDictado(texto) {
  const palabras = String(texto === null || texto === undefined ? "" : texto)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  let inicio = 0;
  while (inicio < palabras.length && MULETILLAS.includes(normalizarTexto(palabras[inicio]))) {
    inicio += 1;
  }
  if (inicio === palabras.length) return palabras.join(" ");
  return palabras.slice(inicio).join(" ");
}

function buscarProducto(productos, nombre) {
  const buscado = normalizarTexto(nombre);
  if (!buscado) return null;

  const catalogo = productos || [];
  const coincidir = (texto) => {
    const exacto = catalogo.find((producto) => normalizarTexto(producto.nombre) === texto);
    if (exacto) return exacto;
    return (
      catalogo.find((producto) => {
        const candidato = normalizarTexto(producto.nombre);
        return candidato.includes(texto) || texto.includes(candidato);
      }) || null
    );
  };

  const directo = coincidir(buscado);
  if (directo) return directo;

  const limpio = limpiarNombreDictado(buscado);
  return limpio === buscado ? null : coincidir(limpio);
}

function siguienteLote(folio) {
  const numero = Number(folio || 0) + 1;
  return `VOZ-${String(numero).padStart(3, "0")}`;
}

function esOperacionRepetida(operaciones, huella, ahoraMs, ventanaMs) {
  const bitacora = operaciones || [];
  const repetida = bitacora.find(
    (operacion) => operacion.huella === huella && ahoraMs - operacion.fecha < ventanaMs,
  );
  return repetida || null;
}

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

function validarPrecios(precioCompra, precioVenta) {
  if (precioVenta > precioCompra) return null;
  return `El precio de venta debe ser mayor al de compra, que es de ${precioCompra} pesos. ¿En cuánto lo vendes?`;
}

function interpretarTipoRevision(valor) {
  const dicho = normalizarTexto(valor);
  if (/caduc|venc|fecha/.test(dicho)) return "caducidad";
  if (/exist|stock|acab|agot|pieza|bajo/.test(dicho)) return "existencias";
  return "todo";
}

function frasePlazo(diasRestantes) {
  if (diasRestantes < 0) {
    const dias = Math.abs(diasRestantes);
    return `venció hace ${dias} ${dias === 1 ? "día" : "días"}`;
  }
  if (diasRestantes === 0) return "vence hoy";
  return `vence en ${diasRestantes} ${diasRestantes === 1 ? "día" : "días"}`;
}

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
  limpiarNombreDictado,
  normalizarTexto,
  resumirBitacora,
  siguienteLote,
  validarPrecios,
};
