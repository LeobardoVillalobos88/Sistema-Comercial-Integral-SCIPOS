const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

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

const CATALOGO = [
  { id: "p-005", nombre: "Leche entera 1L", existencia: 80, precioCompra: 17.9 },
  { id: "p-008", nombre: "Papel higiénico 4 rollos", existencia: 90, precioCompra: 21.5 },
];

describe("normalizarTexto", () => {
  it("quita acentos, baja a minusculas y colapsa espacios", () => {
    assert.equal(normalizarTexto("  Papel  Higiénico  "), "papel higienico");
  });

  it("tolera valores ausentes", () => {
    assert.equal(normalizarTexto(undefined), "");
    assert.equal(normalizarTexto(null), "");
  });
});

describe("buscarProducto", () => {
  it("encuentra por nombre exacto sin importar acentos ni mayusculas", () => {
    assert.equal(buscarProducto(CATALOGO, "papel higienico 4 rollos").id, "p-008");
  });

  it("encuentra por nombre parcial, que es como se dicta en voz alta", () => {
    assert.equal(buscarProducto(CATALOGO, "leche").id, "p-005");
  });

  it("devuelve null cuando no hay coincidencia", () => {
    assert.equal(buscarProducto(CATALOGO, "cemento"), null);
  });

  it("devuelve null con catalogo vacio en vez de reventar", () => {
    assert.equal(buscarProducto([], "leche"), null);
  });

  it("devuelve null cuando el nombre dictado viene vacio", () => {
    assert.equal(buscarProducto(CATALOGO, ""), null);
  });

  it("prefiere la coincidencia exacta sobre la parcial", () => {
    const catalogo = [
      { id: "p-100", nombre: "Leche entera deslactosada" },
      { id: "p-005", nombre: "Leche" },
    ];
    assert.equal(buscarProducto(catalogo, "leche").id, "p-005");
  });
});

describe("siguienteLote", () => {
  it("formatea el folio a tres digitos", () => {
    assert.equal(siguienteLote(0), "VOZ-001");
    assert.equal(siguienteLote(7), "VOZ-008");
  });

  it("no se rompe mas alla de tres digitos", () => {
    assert.equal(siguienteLote(1204), "VOZ-1205");
  });

  it("trata un folio ausente como cero", () => {
    assert.equal(siguienteLote(undefined), "VOZ-001");
  });
});

describe("esOperacionRepetida", () => {
  const ahora = 1_700_000_000_000;
  const ventana = 120_000;
  const operaciones = [
    { huella: "surtir:p-005:50", fecha: ahora - 30_000, resultado: "130 piezas" },
    { huella: "surtir:p-008:10", fecha: ahora - 600_000, resultado: "100 piezas" },
  ];

  it("detecta la misma operacion dentro de la ventana", () => {
    const repetida = esOperacionRepetida(operaciones, "surtir:p-005:50", ahora, ventana);
    assert.equal(repetida.resultado, "130 piezas");
  });

  it("deja pasar la misma operacion fuera de la ventana", () => {
    assert.equal(esOperacionRepetida(operaciones, "surtir:p-008:10", ahora, ventana), null);
  });

  it("deja pasar una huella distinta", () => {
    assert.equal(esOperacionRepetida(operaciones, "surtir:p-005:20", ahora, ventana), null);
  });

  it("tolera una bitacora vacia", () => {
    assert.equal(esOperacionRepetida([], "surtir:p-005:50", ahora, ventana), null);
  });
});

describe("resumirBitacora", () => {
  const ahora = new Date("2026-08-18T15:00:00Z").getTime();

  it("cuenta por tipo y suma el importe del dia", () => {
    const resumen = resumirBitacora(
      [
        { tipo: "registro", producto: "Yogurt", importe: 0, fecha: ahora - 3_600_000 },
        { tipo: "entrada", producto: "Leche", importe: 895, fecha: ahora - 1_800_000 },
        { tipo: "entrada", producto: "Papel", importe: 430, fecha: ahora - 600_000 },
      ],
      ahora,
    );
    assert.equal(resumen.total, 3);
    assert.equal(resumen.productos, 1);
    assert.equal(resumen.entradas, 2);
    assert.equal(resumen.importe, 1325);
    assert.equal(resumen.ultima.producto, "Papel");
  });

  it("ignora las operaciones de dias anteriores", () => {
    const resumen = resumirBitacora(
      [{ tipo: "entrada", producto: "Leche", importe: 500, fecha: ahora - 86_400_000 * 2 }],
      ahora,
    );
    assert.equal(resumen.total, 0);
    assert.equal(resumen.ultima, null);
  });

  it("devuelve ceros con bitacora vacia", () => {
    const resumen = resumirBitacora([], ahora);
    assert.equal(resumen.total, 0);
    assert.equal(resumen.importe, 0);
    assert.equal(resumen.ultima, null);
  });

  it("redondea el importe a dos decimales", () => {
    const resumen = resumirBitacora(
      [
        { tipo: "entrada", producto: "Leche", importe: 17.9 * 3, fecha: ahora - 1000 },
        { tipo: "entrada", producto: "Papel", importe: 21.5 * 3, fecha: ahora - 500 },
      ],
      ahora,
    );
    assert.equal(resumen.importe, 118.2);
  });
});

describe("validarPrecios", () => {
  it("acepta un margen positivo", () => {
    assert.equal(validarPrecios(10, 15), null);
  });

  it("rechaza vender por debajo del costo", () => {
    assert.match(validarPrecios(20, 15), /mayor/);
  });

  it("rechaza vender exactamente al costo", () => {
    assert.notEqual(validarPrecios(20, 20), null);
  });
});

describe("interpretarTipoRevision", () => {
  it("reconoce el valor canonico", () => {
    assert.equal(interpretarTipoRevision("caducidad"), "caducidad");
    assert.equal(interpretarTipoRevision("existencias"), "existencias");
    assert.equal(interpretarTipoRevision("todo"), "todo");
  });

  it("reconoce los sinonimos de caducidad, que es lo que devuelve el slot", () => {
    for (const dicho of [
      "caducidades",
      "vencimiento",
      "vencimientos",
      "lo que se vence",
      "fechas",
    ]) {
      assert.equal(interpretarTipoRevision(dicho), "caducidad", `fallo con "${dicho}"`);
    }
  });

  it("reconoce los sinonimos de existencias", () => {
    for (const dicho of ["existencia", "stock", "lo que se acaba", "inventario bajo", "piezas"]) {
      assert.equal(interpretarTipoRevision(dicho), "existencias", `fallo con "${dicho}"`);
    }
  });

  it("reconoce los sinonimos de todo", () => {
    for (const dicho of ["todas", "completo", "general", "todas las alertas", "ambas"]) {
      assert.equal(interpretarTipoRevision(dicho), "todo", `fallo con "${dicho}"`);
    }
  });

  it("cae en todo cuando no entiende o no llega nada", () => {
    assert.equal(interpretarTipoRevision(""), "todo");
    assert.equal(interpretarTipoRevision(undefined), "todo");
    assert.equal(interpretarTipoRevision("cualquier cosa"), "todo");
  });
});

describe("describirAlertas", () => {
  const alertas = {
    total: 3,
    caducidad: [
      { nombre: "Pan de caja grande", diasRestantes: -4, severidad: "VENCIDO" },
      { nombre: "Leche entera 1L", diasRestantes: 5, severidad: "POR_VENCER" },
    ],
    stock: [{ nombre: "Detergente 1kg", existencia: 0, severidad: "AGOTADO" }],
  };

  it("resume solo caducidad cuando se pide caducidad", () => {
    const frase = describirAlertas(alertas, "caducidad");
    assert.match(frase, /Pan de caja grande/);
    assert.doesNotMatch(frase, /Detergente/);
  });

  it("resume solo existencias cuando se piden existencias", () => {
    const frase = describirAlertas(alertas, "existencias");
    assert.match(frase, /Detergente/);
    assert.doesNotMatch(frase, /Pan de caja/);
  });

  it("resume ambos grupos cuando se pide todo", () => {
    const frase = describirAlertas(alertas, "todo");
    assert.match(frase, /Pan de caja grande/);
    assert.match(frase, /Detergente/);
  });

  it("dice que no hay nada cuando el inventario esta sano", () => {
    const frase = describirAlertas({ total: 0, caducidad: [], stock: [] }, "todo");
    assert.match(frase, /sin alertas|no tienes/i);
  });

  it("distingue lo vencido de lo que esta por vencer", () => {
    const frase = describirAlertas(alertas, "caducidad");
    assert.match(frase, /vencido/i);
    assert.match(frase, /por vencer/i);
  });

  it("avisa cuando el grupo pedido esta limpio pero el otro no", () => {
    const frase = describirAlertas(
      { total: 1, caducidad: [], stock: [{ nombre: "Detergente 1kg", severidad: "AGOTADO" }] },
      "caducidad",
    );
    assert.doesNotMatch(frase, /Detergente/);
    assert.match(frase, /caducar|vencer|caducidad/i);
  });
});
