const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const modelo = require("../modelo-interaccion.json");

const MODELO = modelo.interactionModel.languageModel;
const DIALOGO = modelo.interactionModel.dialog;
const PROMPTS = modelo.interactionModel.prompts;

/** Intents propios de la skill: los de AMAZON no llevan utterances nuestras. */
const INTENTS_PROPIOS = [
  "RegistrarProductoIntent",
  "SurtirInventarioIntent",
  "RevisarInventarioIntent",
  "BitacoraVozIntent",
];

/**
 * Mínimo de utterances por intent. La rúbrica pide 10-15; se duplica ese techo
 * para que la NLU tenga de dónde agarrarse cuando alguien improvise una frase.
 */
const MINIMO_UTTERANCES = 30;

/**
 * Slots de texto libre. Reciben nombres que no se pueden enumerar —cualquier
 * producto, cualquier marca de proveedor—, así que van con AMAZON.SearchQuery
 * en vez de un tipo con lista: una lista finita deja de llenar el slot en
 * cuanto alguien dice algo que no se le parece, y a la tercera Alexa cuelga.
 */
const SLOTS_DE_TEXTO_LIBRE = ["nombreProducto", "producto", "proveedor"];

/** Slots que declaran slot filling y por tanto deben cumplir el criterio de 4 y 8. */
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
    // Amazon rechaza los nombres de invocacion con articulos o preposiciones,
    // asi que no puede llevar el "de" que pediria el espanol.
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

  it("da vocabulario amplio de utterances a cada intent propio", () => {
    for (const nombre of INTENTS_PROPIOS) {
      const cantidad = intent(nombre).samples.length;
      assert.ok(
        cantidad >= MINIMO_UTTERANCES,
        `${nombre} tiene ${cantidad} utterances, se piden ${MINIMO_UTTERANCES}`,
      );
    }
  });

  it("usa AMAZON.SearchQuery en los slots que reciben nombres libres", () => {
    for (const nombreIntent of INTENTS_PROPIOS) {
      for (const slot of intent(nombreIntent).slots || []) {
        if (!SLOTS_DE_TEXTO_LIBRE.includes(slot.name)) continue;
        assert.equal(
          slot.type,
          "AMAZON.SearchQuery",
          `${nombreIntent}.${slot.name} debe ser de texto libre: un tipo con lista cuelga la sesión ante un nombre nuevo`,
        );
      }
    }
  });

  it("no mezcla un slot de texto libre con otro slot en la misma utterance", () => {
    // Amazon rechaza el modelo si AMAZON.SearchQuery comparte utterance con
    // otro slot. Se comprueba aquí para no descubrirlo en el Build Model.
    for (const nombreIntent of INTENTS_PROPIOS) {
      for (const sample of intent(nombreIntent).samples) {
        const usados = [...sample.matchAll(/{([^}]+)}/g)].map((m) => m[1]);
        const libres = usados.filter((u) => SLOTS_DE_TEXTO_LIBRE.includes(u));
        if (libres.length === 0) continue;
        assert.equal(
          usados.length,
          1,
          `"${sample}" (${nombreIntent}) mezcla ${libres[0]} con otros slots`,
        );
      }
    }
  });

  it("acompaña con palabras toda utterance de un slot de texto libre", () => {
    // Una muestra que sea solo "{slot}" no es válida con AMAZON.SearchQuery.
    for (const nombreIntent of INTENTS_PROPIOS) {
      for (const slot of intent(nombreIntent).slots || []) {
        if (!SLOTS_DE_TEXTO_LIBRE.includes(slot.name)) continue;
        for (const sample of slot.samples || []) {
          const sinSlot = sample.replace(/{[^}]+}/g, "").trim();
          assert.ok(
            sinSlot.length > 0,
            `"${sample}" (${nombreIntent}.${slot.name}) necesita palabras además del slot`,
          );
        }
      }
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

  it("declara el tipo de revisión con sinónimos suficientes", () => {
    // Es el único tipo con lista que queda, porque sus opciones sí son cerradas.
    // Lo que no es cerrado es cómo se dicen, así que lleva sinónimos de sobra
    // para que nadie se quede atorado buscando la palabra exacta.
    const tipo = MODELO.types.find((t) => t.name === "SciposTipoRevision");
    assert.ok(tipo, "Falta el tipo SciposTipoRevision");
    assert.equal(tipo.values.length, 3, "Las opciones de revisión son tres y solo tres");
    for (const valor of tipo.values) {
      const sinonimos = (valor.name.synonyms || []).length;
      assert.ok(
        sinonimos >= 8,
        `"${valor.name.value}" tiene ${sinonimos} sinónimos; se piden 8 para no atorar a quien no dé con la palabra exacta`,
      );
    }
  });

  it("no deja tipos personalizados sin usar", () => {
    const usados = new Set();
    for (const i of MODELO.intents) {
      for (const slot of i.slots || []) usados.add(slot.type);
    }
    const huerfanos = MODELO.types.map((t) => t.name).filter((t) => !usados.has(t));
    assert.deepEqual(huerfanos, [], `Tipos declarados y nunca usados: ${huerfanos}`);
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
