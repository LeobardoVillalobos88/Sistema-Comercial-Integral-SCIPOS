import type { Cotizacion, EstadoCotizacion } from "@scipos/frontend-commons";

export interface VentaMock {
  id: string;
  folio: string;
  clienteId: string;
  fecha: string;
  total: number;
  metodoPago: string;
}

// Historial de cotizaciones mock asociadas a los clientes por ID
export const COTIZACIONES_MOCK_HISTORIAL: Cotizacion[] = [
  {
    id: "cot-001",
    folio: "COT-2026-001",
    clienteId: "c-001",
    fecha: "2026-06-15",
    estado: "CONVERTIDA" as EstadoCotizacion,
    partidas: [
      { productoId: "p-001", cantidad: 2, precioUnitario: 350 },
      { productoId: "p-002", cantidad: 1, precioUnitario: 1200 },
    ],
  },
  {
    id: "cot-002",
    folio: "COT-2026-002",
    clienteId: "c-001",
    fecha: "2026-06-28",
    estado: "ENVIADA" as EstadoCotizacion,
    partidas: [{ productoId: "p-003", cantidad: 5, precioUnitario: 80 }],
  },
  {
    id: "cot-003",
    folio: "COT-2026-003",
    clienteId: "c-002",
    fecha: "2026-06-18",
    estado: "CONVERTIDA" as EstadoCotizacion,
    partidas: [{ productoId: "p-002", cantidad: 1, precioUnitario: 1200 }],
  },
  {
    id: "cot-004",
    folio: "COT-2026-004",
    clienteId: "c-003",
    fecha: "2026-06-10",
    estado: "BORRADOR" as EstadoCotizacion,
    partidas: [{ productoId: "p-001", cantidad: 10, precioUnitario: 320 }],
  },
  {
    id: "cot-005",
    folio: "COT-2026-005",
    clienteId: "c-003",
    fecha: "2026-06-25",
    estado: "ENVIADA" as EstadoCotizacion,
    partidas: [{ productoId: "p-004", cantidad: 2, precioUnitario: 4500 }],
  },
];

// Historial de ventas mock asociadas a los clientes por ID
export const VENTAS_MOCK_HISTORIAL: VentaMock[] = [
  {
    id: "ven-001",
    folio: "VTA-2026-101",
    clienteId: "c-001",
    fecha: "2026-06-15",
    total: 1900.0,
    metodoPago: "Tarjeta de Crédito",
  },
  {
    id: "ven-002",
    folio: "VTA-2026-102",
    clienteId: "c-002",
    fecha: "2026-06-18",
    total: 1200.0,
    metodoPago: "Efectivo",
  },
  {
    id: "ven-003",
    folio: "VTA-2026-103",
    clienteId: "c-003",
    fecha: "2026-06-20",
    total: 12500.0,
    metodoPago: "Transferencia",
  },
];
