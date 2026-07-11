import type { Cotizacion } from "./tipos";

/**
 * Cotizaciones de ejemplo (lo consume el módulo de Ángel). Referencian los
 * mismos IDs de `CLIENTES_MOCK` y `PRODUCTOS_MOCK` para que la demo embone.
 */
export const COTIZACIONES_MOCK: Cotizacion[] = [
  {
    id: "cot-001",
    folio: "COT-2026-0001",
    clienteId: "c-001",
    fecha: "2026-05-10T10:15:00.000Z",
    estado: "VENDIDA",
    partidas: [
      { productoId: "p-001", cantidad: 3, precioUnitario: 45.5 },
      { productoId: "p-002", cantidad: 6, precioUnitario: 18.0 },
    ],
  },
  {
    id: "cot-002",
    folio: "COT-2026-0002",
    clienteId: "c-002",
    fecha: "2026-05-14T09:30:00.000Z",
    estado: "ENVIADA",
    partidas: [
      { productoId: "p-005", cantidad: 2, precioUnitario: 27.5 },
      { productoId: "p-008", cantidad: 4, precioUnitario: 33.0 },
    ],
  },
  {
    id: "cot-003",
    folio: "COT-2026-0003",
    clienteId: "c-001",
    fecha: "2026-05-20T16:45:00.000Z",
    estado: "BORRADOR",
    partidas: [{ productoId: "p-011", cantidad: 10, precioUnitario: 24.9 }],
  },
  {
    id: "cot-004",
    folio: "COT-2026-0004",
    clienteId: "c-003",
    fecha: "2026-05-22T11:00:00.000Z",
    estado: "VENDIDA",
    partidas: [
      { productoId: "p-013", cantidad: 1, precioUnitario: 65.0 },
      { productoId: "p-014", cantidad: 5, precioUnitario: 50.0 },
    ],
  },
  {
    id: "cot-005",
    folio: "COT-2026-0005",
    clienteId: "c-006",
    fecha: "2026-06-02T13:20:00.000Z",
    estado: "ENVIADA",
    partidas: [
      { productoId: "p-006", cantidad: 3, precioUnitario: 52.0 },
      { productoId: "p-007", cantidad: 6, precioUnitario: 14.5 },
      { productoId: "p-009", cantidad: 10, precioUnitario: 16.0 },
    ],
  },
  {
    id: "cot-006",
    folio: "COT-2026-0006",
    clienteId: "c-009",
    fecha: "2026-06-05T08:50:00.000Z",
    estado: "BORRADOR",
    partidas: [{ productoId: "p-017", cantidad: 2, precioUnitario: 78.0 }],
  },
  {
    id: "cot-007",
    folio: "COT-2026-0007",
    clienteId: "c-005",
    fecha: "2026-06-10T15:10:00.000Z",
    estado: "VENDIDA",
    partidas: [
      { productoId: "p-003", cantidad: 12, precioUnitario: 12.0 },
      { productoId: "p-004", cantidad: 5, precioUnitario: 38.9 },
    ],
  },
  {
    id: "cot-008",
    folio: "COT-2026-0008",
    clienteId: "c-002",
    fecha: "2026-06-18T10:05:00.000Z",
    estado: "ENVIADA",
    partidas: [
      { productoId: "p-010", cantidad: 8, precioUnitario: 22.0 },
      { productoId: "p-016", cantidad: 20, precioUnitario: 9.5 },
    ],
  },
  {
    id: "cot-009",
    folio: "COT-2026-0009",
    clienteId: "c-008",
    fecha: "2026-06-25T12:40:00.000Z",
    estado: "BORRADOR",
    partidas: [
      { productoId: "p-015", cantidad: 3, precioUnitario: 10.0 },
      { productoId: "p-012", cantidad: 4, precioUnitario: 19.9 },
    ],
  },
  {
    id: "cot-010",
    folio: "COT-2026-0010",
    clienteId: "c-003",
    fecha: "2026-06-29T09:00:00.000Z",
    estado: "ENVIADA",
    partidas: [
      { productoId: "p-001", cantidad: 5, precioUnitario: 45.5 },
      { productoId: "p-002", cantidad: 10, precioUnitario: 18.0 },
      { productoId: "p-008", cantidad: 3, precioUnitario: 33.0 },
    ],
  },
];
