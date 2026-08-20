const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const modelo = require("../modelo-interaccion.json");

const MODELO = modelo.interactionModel.languageModel;
const DIALOGO = modelo.interactionModel.dialog;
const PROMPTS = modelo.interactionModel.prompts;

const INTENTS_PROPIOS = [
  "RegistrarProductoIntent",
  "SurtirInventarioIntent",
  "RevisarInventarioIntent",
  "BitacoraVozIntent",
];

const SLOTS_CON_LLENADO = [
  ["RegistrarProductoIntent", "nombreProducto"],
  ["RegistrarProductoIntent", "precioCompra"],
  ["RegistrarProductoIntent", "precioVenta"],
  ["RegistrarProductoIntent", "fechaCaducidad"],
  ["SurtirInventarioIntent", "producto"],
  ["SurtirInventarioIntent", "cantidad"],
  ["SurtirInventarioIntent", "proveedor"],
  ["RevisarInventarioIntent", "tipoRevision"],
];

function intent(nombre) {
  const encontrado = MODELO.intents.find((i) => i.name === nombre);
  assert.ok(encontrado, `Falta el intent ${nombre} en el modelo`);
  return encontrado;
}

function intentDialogo(nombre) {
  const encontrado = DIALOGO.intents.find((i) => i.name === nombre);
  assert.ok(encontrado, `Falta el intent ${nombre} en la seccion dialog`);
  return encontrado;
}

function prompt(id) {
  const encontrado = PROMPTS.find((p) => p.id === id);
  assert.ok(encontrado, `Falta el prompt ${id}`);
  return encontrado;
}

describe("modelo de interaccion", () => {
  it("declara el nombre de invocacion sin tilde y sin preposiciones", () => {
    assert.equal(MODELO.invocationName, "asistente almacen");
  });

  it("declara los cuatro intents propios y los estandar de AMAZON", () => {
    const nombres = MODELO.intents.map((i) => i.name);
    for (const propio of INTENTS_PROPIOS) {
      assert.ok(nombres.includes(propio), `Falta ${propio}`);
    }
    for (const estandar of [
      "AMAZON.HelpIntent",
      "AMAZON.CancelIntent",
      "AMAZON.StopIntent",
      "AMAZON.FallbackIntent",
      "AMAZON.NavigateHomeIntent",
    ]) {
      assert.ok(nombres.includes(estandar), `Falta ${estandar}`);
    }
  });

  it("da al menos 15 utterances a cada intent propio", () => {
    for (const nombre of INTENTS_PROPIOS) {
      const cantidad = intent(nombre).samples.length;
      assert.ok(cantidad >= 15, `${nombre} tiene ${cantidad} utterances, se piden 15`);
    }
  });

  it("no repite utterances dentro de un mismo intent", () => {
    for (const nombre of INTENTS_PROPIOS) {
      const samples = intent(nombre).samples.map((s) => s.toLowerCase().trim());
      assert.equal(new Set(samples).size, samples.length, `${nombre} repite utterances`);
    }
  });

  it("no repite una misma utterance entre intents distintos", () => {
    const vistas = new Map();
    for (const nombre of INTENTS_PROPIOS) {
      for (const sample of intent(nombre).samples) {
        const clave = sample.toLowerCase().trim();
        assert.ok(!vistas.has(clave), `"${sample}" esta en ${nombre} y en ${vistas.get(clave)}`);
        vistas.set(clave, nombre);
      }
    }
  });

  it("da 8 utterances de usuario a cada slot con llenado", () => {
    for (const [nombreIntent, nombreSlot] of SLOTS_CON_LLENADO) {
      const slot = intent(nombreIntent).slots.find((s) => s.name === nombreSlot);
      assert.ok(slot, `Falta el slot ${nombreSlot} en ${nombreIntent}`);
      const cantidad = (slot.samples || []).length;
      assert.ok(
        cantidad >= 8,
        `${nombreIntent}.${nombreSlot} tiene ${cantidad} samples, se piden 8`,
      );
    }
  });

  it("da 4 speeches de elicitacion a cada slot con llenado", () => {
    for (const [nombreIntent, nombreSlot] of SLOTS_CON_LLENADO) {
      const slot = intentDialogo(nombreIntent).slots.find((s) => s.name === nombreSlot);
      assert.ok(slot, `Falta el slot ${nombreSlot} en el dialog de ${nombreIntent}`);
      assert.equal(slot.elicitationRequired, true, `${nombreSlot} no exige elicitacion`);
      const variaciones = prompt(slot.prompts.elicitation).variations.length;
      assert.ok(
        variaciones >= 4,
        `La elicitacion de ${nombreIntent}.${nombreSlot} tiene ${variaciones}, se piden 4`,
      );
    }
  });

  it("da 2 speeches a cada confirmacion de slot configurada", () => {
    for (const intentDlg of DIALOGO.intents) {
      for (const slot of intentDlg.slots || []) {
        if (!slot.confirmationRequired) continue;
        const variaciones = prompt(slot.prompts.confirmation).variations.length;
        assert.ok(
          variaciones >= 2,
          `La confirmacion de ${intentDlg.name}.${slot.name} tiene ${variaciones}, se piden 2`,
        );
      }
    }
  });

  it("da 2 speeches a cada confirmacion de intent configurada", () => {
    for (const intentDlg of DIALOGO.intents) {
      if (!intentDlg.confirmationRequired) continue;
      const variaciones = prompt(intentDlg.prompts.confirmation).variations.length;
      assert.ok(
        variaciones >= 2,
        `La confirmacion de ${intentDlg.name} tiene ${variaciones}, se piden 2`,
      );
    }
  });

  it("da 2 speeches a cada validacion de slot configurada", () => {
    let validacionesVistas = 0;
    for (const intentDlg of DIALOGO.intents) {
      for (const slot of intentDlg.slots || []) {
        for (const validacion of slot.validations || []) {
          validacionesVistas += 1;
          const variaciones = prompt(validacion.prompt).variations.length;
          assert.ok(
            variaciones >= 2,
            `La validacion ${validacion.type} de ${slot.name} tiene ${variaciones}, se piden 2`,
          );
        }
      }
    }
    assert.ok(validacionesVistas >= 4, "Se esperan al menos 4 validaciones configuradas");
  });

  it("delega el dialogo a Alexa", () => {
    assert.equal(DIALOGO.delegationStrategy, "ALWAYS");
  });

  it("declara los tres tipos personalizados con sinonimos", () => {
    for (const nombre of ["SciposProducto", "SciposProveedor", "SciposTipoRevision"]) {
      const tipo = MODELO.types.find((t) => t.name === nombre);
      assert.ok(tipo, `Falta el tipo ${nombre}`);
      assert.ok(tipo.values.length > 0, `${nombre} no tiene valores`);
    }
    const productos = MODELO.types.find((t) => t.name === "SciposProducto");
    assert.ok(
      productos.values.length >= 25,
      `SciposProducto tiene ${productos.values.length} valores; con pocos la NLU fuerza los nombres nuevos hacia la lista`,
    );
  });

  it("no deja prompts declarados sin usar", () => {
    const usados = new Set();
    for (const intentDlg of DIALOGO.intents) {
      if (intentDlg.prompts?.confirmation) {
        usados.add(intentDlg.prompts.confirmation);
      }
      for (const slot of intentDlg.slots || []) {
        for (const id of Object.values(slot.prompts || {})) usados.add(id);
        for (const validacion of slot.validations || []) usados.add(validacion.prompt);
      }
    }
    const huerfanos = PROMPTS.filter((p) => !usados.has(p.id)).map((p) => p.id);
    assert.deepEqual(huerfanos, [], `Prompts declarados y nunca usados: ${huerfanos}`);
  });
});
