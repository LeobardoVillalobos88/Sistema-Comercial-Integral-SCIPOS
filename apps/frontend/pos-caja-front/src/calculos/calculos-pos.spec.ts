import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ItemCarrito, ProductoPos } from "../types/pos";
import {
  agregarAlCarrito,
  calcularTotales,
  cambiarCantidad,
  cantidadEnCarrito,
  crearItemCarrito,
  precioSegunModo,
  quitarDelCarrito,
} from "./calculos-pos";

function producto(parcial: Partial<ProductoPos> = {}): ProductoPos {
  return {
    id: "p-001",
    clave: "ABA-001",
    nombre: "Abarrote surtido 1kg",
    precioCompra: 80,
    precioVenta: 100,
    existencia: 10,
    estado: "Activo",
    ...parcial,
  };
}

function partida(parcial: Partial<ItemCarrito> = {}): ItemCarrito {
  return {
    productoId: "p-001",
    clave: "ABA-001",
    nombre: "Abarrote surtido 1kg",
    precioUnitario: 100,
    cantidad: 1,
    subtotal: 100,
    ...parcial,
  };
}

/** Identificadores de las partidas, para afirmar sobre el contenido del carrito. */
function claves(carrito: ItemCarrito[]): string[] {
  return carrito.map((item) => item.productoId);
}

describe("precioSegunModo", () => {
  it("en venta toma el precio de venta", () => {
    assert.equal(precioSegunModo(producto(), "venta"), 100);
  });

  it("en compra toma el precio de compra", () => {
    assert.equal(precioSegunModo(producto(), "compra"), 80);
  });
});

describe("crearItemCarrito", () => {
  it("arranca con una unidad y el importe igual al precio unitario", () => {
    const item = crearItemCarrito(producto(), "venta");

    assert.equal(item.productoId, "p-001");
    assert.equal(item.cantidad, 1);
    assert.equal(item.precioUnitario, 100);
    assert.equal(item.subtotal, 100);
  });

  it("usa el precio de compra cuando el modo es compra", () => {
    const item = crearItemCarrito(producto(), "compra");

    assert.equal(item.precioUnitario, 80);
    assert.equal(item.subtotal, 80);
  });
});

describe("calcularTotales en modo compra", () => {
  // El servicio guarda la compra como la suma de cantidad por precio de compra,
  // y su DTO ni siquiera acepta descuento. Si la pantalla aplicara la
  // aritmética de venta, mostraría un total que la base no tiene.
  it("el total es el subtotal, sin nada encima", () => {
    const totales = calcularTotales([partida({ cantidad: 5, subtotal: 50 })], 0, "compra");

    assert.equal(totales.subtotal, 50);
    assert.equal(totales.total, 50);
  });

  it("ignora el descuento, que la compra no admite", () => {
    const totales = calcularTotales([partida({ subtotal: 200 })], 100, "compra");

    assert.equal(totales.descuento, 0);
    assert.equal(totales.total, 200);
  });

  it("con el carrito vacío devuelve todo en cero", () => {
    assert.deepEqual(calcularTotales([], 0, "compra"), {
      subtotal: 0,
      descuento: 0,
      total: 0,
    });
  });

  it("coincide con lo que el servicio guarda como total de la compra", () => {
    // El backend calcula: suma de cantidad x precioCompra de cada partida.
    const carrito = [
      partida({ cantidad: 5, subtotal: 50 }),
      partida({ productoId: "p-002", cantidad: 3, subtotal: 36 }),
    ];
    const comoElBackend = carrito.reduce((suma, item) => suma + item.subtotal, 0);

    assert.equal(calcularTotales(carrito, 0, "compra").total, comoElBackend);
  });
});

describe("calcularTotales", () => {
  it("con el carrito vacío devuelve todo en cero", () => {
    assert.deepEqual(calcularTotales([], 0, "venta"), {
      subtotal: 0,
      descuento: 0,
      total: 0,
    });
  });

  it("el total es lo que se cobra: los precios del catálogo ya son los finales", () => {
    const totales = calcularTotales([partida({ cantidad: 2, subtotal: 200 })], 0, "venta");

    assert.equal(totales.subtotal, 200);
    assert.equal(totales.total, 200);
  });

  it("resta el descuento del total", () => {
    const totales = calcularTotales([partida({ cantidad: 2, subtotal: 200 })], 100, "venta");

    assert.equal(totales.descuento, 100);
    assert.equal(totales.total, 100);
  });

  it("recorta un descuento mayor que el subtotal en lugar de generar un negativo", () => {
    const totales = calcularTotales([partida({ subtotal: 100 })], 500, "venta");

    assert.equal(totales.descuento, 100);
    assert.equal(totales.total, 0);
  });

  it("acumula los importes de varias partidas", () => {
    const carrito = [
      partida({ productoId: "p-001", subtotal: 100 }),
      partida({ productoId: "p-002", subtotal: 250 }),
    ];

    assert.equal(calcularTotales(carrito, 0, "venta").subtotal, 350);
  });
});

describe("agregarAlCarrito", () => {
  it("añade el producto cuando todavía no está", () => {
    const carrito = agregarAlCarrito([], producto(), "venta");

    assert.deepEqual(claves(carrito), ["p-001"]);
    assert.equal(cantidadEnCarrito(carrito, "p-001"), 1);
  });

  it("suma una unidad si el producto ya estaba, sin duplicar la partida", () => {
    const inicial = agregarAlCarrito([], producto(), "venta");

    const carrito = agregarAlCarrito(inicial, producto(), "venta");

    assert.deepEqual(claves(carrito), ["p-001"]);
    assert.equal(cantidadEnCarrito(carrito, "p-001"), 2);
    assert.equal(calcularTotales(carrito, 0, "venta").subtotal, 200);
  });

  it("no modifica el carrito que recibe", () => {
    const inicial: ItemCarrito[] = [];

    agregarAlCarrito(inicial, producto(), "venta");

    assert.equal(inicial.length, 0);
  });
});

describe("cambiarCantidad", () => {
  it("recalcula el importe al sumar unidades", () => {
    const carrito = cambiarCantidad([partida()], "p-001", 2);

    assert.equal(cantidadEnCarrito(carrito, "p-001"), 3);
    assert.equal(calcularTotales(carrito, 0, "venta").subtotal, 300);
  });

  it("saca la partida del carrito cuando la cantidad llega a cero", () => {
    const carrito = cambiarCantidad([partida()], "p-001", -1);

    assert.deepEqual(carrito, []);
  });

  it("deja intactas las demás partidas", () => {
    const inicial = [partida({ productoId: "p-001" }), partida({ productoId: "p-002" })];

    const carrito = cambiarCantidad(inicial, "p-001", 1);

    assert.deepEqual(claves(carrito), ["p-001", "p-002"]);
    assert.equal(cantidadEnCarrito(carrito, "p-002"), 1);
  });
});

describe("quitarDelCarrito", () => {
  it("elimina solo la partida indicada", () => {
    const inicial = [partida({ productoId: "p-001" }), partida({ productoId: "p-002" })];

    assert.deepEqual(claves(quitarDelCarrito(inicial, "p-001")), ["p-002"]);
  });
});

describe("cantidadEnCarrito", () => {
  it("devuelve cero cuando el producto no está", () => {
    assert.equal(cantidadEnCarrito([], "p-001"), 0);
  });

  it("devuelve las unidades de la partida", () => {
    assert.equal(cantidadEnCarrito([partida({ cantidad: 4 })], "p-001"), 4);
  });
});
