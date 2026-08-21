import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calcularTotales } from "./calculos-cotizacion";

describe("calcularTotales", () => {
  it("calcula importes, subtotal y total redondeados a centavos", () => {
    const resultado = calcularTotales([
      {
        productoId: "p-001",
        productoNombre: "Producto uno",
        cantidad: 3,
        precioUnitario: "10.125",
      },
      {
        productoId: "p-002",
        productoNombre: "Producto dos",
        cantidad: 2,
        precioUnitario: "5.20",
      },
    ]);

    assert.equal(resultado.partidas[0]?.precioUnitario.toFixed(2), "10.13");
    assert.equal(resultado.partidas[0]?.importe.toFixed(2), "30.39");
    assert.equal(resultado.subtotal.toFixed(2), "40.79");
    // Sin impuesto encima: el total es el subtotal.
    assert.equal(resultado.total.toFixed(2), "40.79");
  });

  it("rechaza precios negativos provenientes del servicio de productos", () => {
    assert.throws(
      () =>
        calcularTotales([
          {
            productoId: "p-001",
            productoNombre: "Producto inválido",
            cantidad: 1,
            precioUnitario: -0.01,
          },
        ]),
      /precio inválido/,
    );
  });
});
