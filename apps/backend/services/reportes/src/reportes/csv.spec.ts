import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  TIPOS_EXPORTABLES,
  aCsv,
  csvCortes,
  csvInventario,
  csvVentas,
  esTipoExportable,
} from "./csv";

describe("aCsv", () => {
  it("entrecomilla cada celda y separa las filas con CRLF", () => {
    const csv = aCsv(["A", "B"], [["1", "2"]]);
    assert.equal(csv, '﻿"A","B"\r\n"1","2"');
  });

  it("duplica las comillas internas para que no partan la celda", () => {
    const csv = aCsv(["Nombre"], [['Refresco "Cola" 600ml']]);
    assert.ok(csv.includes('"Refresco ""Cola"" 600ml"'));
  });

  it("no parte la fila cuando un dato trae una coma", () => {
    const csv = aCsv(["Cliente", "Total"], [["Ferretería, S.A. de C.V.", "100.00"]]);
    const filaDatos = csv.split("\r\n")[1];
    assert.equal(filaDatos, '"Ferretería, S.A. de C.V.","100.00"');
  });

  it("abre con la marca de orden de bytes para que Excel respete los acentos", () => {
    assert.ok(aCsv(["Descripción"], []).startsWith("﻿"));
  });

  it("escribe solo los encabezados cuando no hay filas", () => {
    assert.equal(aCsv(["A"], []), '﻿"A"');
  });
});

describe("esTipoExportable", () => {
  it("acepta los cuatro reportes descargables", () => {
    for (const tipo of TIPOS_EXPORTABLES) {
      assert.equal(esTipoExportable(tipo), true);
    }
  });

  it("rechaza cualquier otro valor de la ruta", () => {
    assert.equal(esTipoExportable("utilidad"), false);
    assert.equal(esTipoExportable("../../etc/passwd"), false);
    assert.equal(esTipoExportable(""), false);
  });
});

describe("archivos por reporte", () => {
  it("da a los importes dos decimales fijos", () => {
    const archivo = csvVentas([
      {
        id: "VTA-1",
        clienteId: "c-001",
        estado: "COMPLETA",
        descuento: 0,
        total: 1160.5,
        fecha: "2026-08-20T10:00:00.000Z",
      },
    ]);
    assert.ok(archivo.contenido.includes('"0.00"'));
    assert.ok(archivo.contenido.includes('"1160.50"'));
  });

  it("deja vacía la celda de cierre de un turno todavía abierto", () => {
    const archivo = csvCortes([
      {
        id: "CAJA-1",
        montoInicial: 500,
        montoFinal: null,
        fechaApertura: "2026-08-20T08:00:00.000Z",
        fechaCierre: null,
      },
    ]);
    const filaDatos = archivo.contenido.split("\r\n")[1];
    assert.equal(filaDatos, '"CAJA-1","500.00","","2026-08-20T08:00:00.000Z",""');
  });

  it("traduce el booleano de activo a una palabra legible", () => {
    const archivo = csvInventario([
      {
        nombre: "Martillo",
        tipo: "PRODUCTO",
        precioCompra: 50,
        precioVenta: 90,
        existencia: 3,
        activo: false,
      },
    ]);
    assert.ok(archivo.contenido.includes('"INACTIVO"'));
    assert.ok(!archivo.contenido.includes("false"));
  });

  it("nombra el archivo según el reporte", () => {
    assert.equal(csvVentas([]).nombre, "reporte-ventas.csv");
    assert.equal(csvCortes([]).nombre, "reporte-cortes.csv");
  });
});
