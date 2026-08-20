import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { type ProductoInventario, calcularAlertas } from "./alertas-inventario";
import { configuracionInventario } from "./configuracion-inventario";

const CONFIGURACION = { umbralStockBajo: 5, diasAvisoCaducidad: 14 };
const HOY = new Date("2026-08-17T12:00:00");

function producto(datos: Partial<ProductoInventario> = {}): ProductoInventario {
  return {
    id: "p-001",
    nombre: "Producto de prueba",
    lote: "LOT-001",
    tipo: "PRODUCTO",
    existencia: 100,
    fechaCaducidad: null,
    activo: true,
    ...datos,
  };
}

describe("calcularAlertas: caducidad", () => {
  it("marca como vencido el lote cuya fecha ya pasó, con días negativos", () => {
    const alertas = calcularAlertas(
      [producto({ fechaCaducidad: new Date("2026-08-10T00:00:00") })],
      CONFIGURACION,
      HOY,
    );

    assert.equal(alertas.caducidad.length, 1);
    assert.equal(alertas.caducidad[0]?.severidad, "VENCIDO");
    assert.equal(alertas.caducidad[0]?.diasRestantes, -7);
  });

  it("avisa del lote que vence justo en el borde de la ventana", () => {
    const alertas = calcularAlertas(
      [producto({ fechaCaducidad: new Date("2026-08-31T00:00:00") })],
      CONFIGURACION,
      HOY,
    );

    assert.equal(alertas.caducidad.length, 1);
    assert.equal(alertas.caducidad[0]?.severidad, "POR_VENCER");
    assert.equal(alertas.caducidad[0]?.diasRestantes, 14);
  });

  it("no avisa del lote que vence un día después de la ventana", () => {
    const alertas = calcularAlertas(
      [producto({ fechaCaducidad: new Date("2026-09-01T00:00:00") })],
      CONFIGURACION,
      HOY,
    );

    assert.equal(alertas.caducidad.length, 0);
  });

  it("considera vencido hoy el lote que caduca hoy más tarde", () => {
    const alertas = calcularAlertas(
      [producto({ fechaCaducidad: new Date("2026-08-17T23:00:00") })],
      CONFIGURACION,
      HOY,
    );

    assert.equal(alertas.caducidad[0]?.diasRestantes, 0);
    assert.equal(alertas.caducidad[0]?.severidad, "POR_VENCER");
  });

  it("ignora los productos sin fecha de caducidad", () => {
    const alertas = calcularAlertas([producto({ fechaCaducidad: null })], CONFIGURACION, HOY);

    assert.equal(alertas.caducidad.length, 0);
  });
});

describe("calcularAlertas: existencias", () => {
  it("marca como agotado el producto sin existencia", () => {
    const alertas = calcularAlertas([producto({ existencia: 0 })], CONFIGURACION, HOY);

    assert.equal(alertas.stock.length, 1);
    assert.equal(alertas.stock[0]?.severidad, "AGOTADO");
  });

  it("marca como bajo el producto que está justo en el umbral", () => {
    const alertas = calcularAlertas([producto({ existencia: 5 })], CONFIGURACION, HOY);

    assert.equal(alertas.stock.length, 1);
    assert.equal(alertas.stock[0]?.severidad, "BAJO");
  });

  it("no alerta del producto que está un paso arriba del umbral", () => {
    const alertas = calcularAlertas([producto({ existencia: 6 })], CONFIGURACION, HOY);

    assert.equal(alertas.stock.length, 0);
  });

  it("no alerta de existencias de un servicio, que no tiene inventario", () => {
    const alertas = calcularAlertas(
      [producto({ tipo: "SERVICIO", existencia: 0 })],
      CONFIGURACION,
      HOY,
    );

    assert.equal(alertas.stock.length, 0);
  });
});

describe("calcularAlertas: alcance y orden", () => {
  it("no alerta de productos dados de baja", () => {
    const alertas = calcularAlertas(
      [
        producto({
          activo: false,
          existencia: 0,
          fechaCaducidad: new Date("2026-08-01T00:00:00"),
        }),
      ],
      CONFIGURACION,
      HOY,
    );

    assert.equal(alertas.total, 0);
  });

  it("ordena cada grupo de lo más urgente a lo menos", () => {
    const alertas = calcularAlertas(
      [
        producto({ id: "a", nombre: "Escaso", existencia: 4 }),
        producto({ id: "b", nombre: "Agotado", existencia: 0 }),
        producto({
          id: "c",
          nombre: "Por vencer",
          fechaCaducidad: new Date("2026-08-25T00:00:00"),
        }),
        producto({
          id: "d",
          nombre: "Vencido",
          fechaCaducidad: new Date("2026-08-01T00:00:00"),
        }),
      ],
      CONFIGURACION,
      HOY,
    );

    assert.deepEqual(
      alertas.caducidad.map((a) => a.severidad),
      ["VENCIDO", "POR_VENCER"],
    );
    assert.deepEqual(
      alertas.stock.map((a) => a.severidad),
      ["AGOTADO", "BAJO"],
    );
  });

  it("cuenta en el total las alertas de ambos grupos y reporta los umbrales usados", () => {
    const alertas = calcularAlertas(
      [
        producto({
          id: "a",
          existencia: 0,
          fechaCaducidad: new Date("2026-08-01T00:00:00"),
        }),
      ],
      CONFIGURACION,
      HOY,
    );

    assert.equal(alertas.total, 2);
    assert.deepEqual(alertas.umbrales, { stockBajo: 5, diasCaducidad: 14 });
  });
});

describe("configuracionInventario", () => {
  it("usa 5 de existencia y 14 días cuando el entorno no dice nada", () => {
    assert.deepEqual(configuracionInventario({}), {
      umbralStockBajo: 5,
      diasAvisoCaducidad: 14,
    });
  });

  it("respeta los valores del entorno", () => {
    assert.deepEqual(
      configuracionInventario({ UMBRAL_STOCK_BAJO: "12", DIAS_AVISO_CADUCIDAD: "30" }),
      { umbralStockBajo: 12, diasAvisoCaducidad: 30 },
    );
  });

  it("cae en los valores por defecto ante un entorno mal escrito", () => {
    assert.deepEqual(
      configuracionInventario({ UMBRAL_STOCK_BAJO: "cinco", DIAS_AVISO_CADUCIDAD: "-3" }),
      { umbralStockBajo: 5, diasAvisoCaducidad: 14 },
    );
  });
});
