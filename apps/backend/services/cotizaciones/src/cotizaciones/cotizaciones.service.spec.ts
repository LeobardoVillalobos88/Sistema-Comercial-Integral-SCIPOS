import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ConfigService } from "@nestjs/config";
import Decimal from "decimal.js";
import { EstadoCotizacion } from ".prisma/client";

import { ClientesClient } from "../integraciones/clientes.client";
import { ProductosClient } from "../integraciones/productos.client";
import { VentasClient } from "../integraciones/ventas.client";
import { PrismaService } from "../prisma/prisma.service";
import { CotizacionesService } from "./cotizaciones.service";

function cotizacionEnviada() {
  return {
    id: "cot-002",
    folio: "COT-000002",
    clienteId: "c-003",
    clienteNombre: "Comercializadora del Sur",
    estado: EstadoCotizacion.ENVIADA,
    subtotal: new Decimal("100.00"),
    total: new Decimal("100.00"),
    ventaId: null,
    creadaEn: new Date("2026-07-15T17:30:00.000Z"),
    actualizadaEn: new Date("2026-07-15T17:30:00.000Z"),
    partidas: [
      {
        id: "partida-001",
        cotizacionId: "cot-002",
        productoId: "p-001",
        productoNombre: "Abarrote surtido 1kg",
        cantidad: 2,
        precioUnitario: new Decimal("50.00"),
        importe: new Decimal("100.00"),
      },
    ],
  };
}

const config = { get: () => "16" } as unknown as ConfigService;
const clientes = {} as ClientesClient;
const productos = {} as ProductosClient;

describe("CotizacionesService.convertir", () => {
  it("no marca la cotización como VENDIDA si ventas-caja falla", async () => {
    let actualizo = false;
    const tx = {
      $queryRaw: async () => [{ id: "cot-002" }],
      cotizacion: {
        findUnique: async () => cotizacionEnviada(),
        update: async () => {
          actualizo = true;
        },
      },
    };
    const prisma = {
      $transaction: (operacion: (cliente: typeof tx) => unknown) => operacion(tx),
    } as unknown as PrismaService;
    const ventas = {
      crearDesdeCotizacion: async () => {
        throw new Error("ventas no disponible");
      },
    } as unknown as VentasClient;
    const servicio = new CotizacionesService(prisma, clientes, productos, ventas, config);

    await assert.rejects(
      () => servicio.convertir("cot-002", "usuario-vendedor"),
      /ventas no disponible/,
    );
    assert.equal(actualizo, false);
  });

  it("guarda ventaId y VENDIDA después de que ventas-caja confirma la venta", async () => {
    const enviada = cotizacionEnviada();
    const vendida = { ...enviada, estado: EstadoCotizacion.VENDIDA, ventaId: "venta-001" };
    let datosActualizacion: unknown;
    const tx = {
      $queryRaw: async () => [{ id: "cot-002" }],
      cotizacion: {
        findUnique: async () => enviada,
        update: async (entrada: unknown) => {
          datosActualizacion = entrada;
          return vendida;
        },
      },
    };
    const prisma = {
      $transaction: (operacion: (cliente: typeof tx) => unknown) => operacion(tx),
    } as unknown as PrismaService;
    const ventas = {
      crearDesdeCotizacion: async () => ({ id: "venta-001" }),
    } as unknown as VentasClient;
    const servicio = new CotizacionesService(prisma, clientes, productos, ventas, config);

    const resultado = await servicio.convertir("cot-002", "usuario-vendedor");

    assert.deepEqual(datosActualizacion, {
      where: { id: "cot-002" },
      data: { estado: EstadoCotizacion.VENDIDA, ventaId: "venta-001" },
      include: { partidas: { orderBy: { id: "asc" } } },
    });
    assert.equal(resultado.estado, EstadoCotizacion.VENDIDA);
    assert.equal(resultado.ventaId, "venta-001");
  });
});
