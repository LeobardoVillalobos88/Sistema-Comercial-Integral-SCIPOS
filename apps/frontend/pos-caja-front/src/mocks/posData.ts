export interface Producto {
  id: string;
  clave: string;
  nombre: string;
  precio: number;
  existencia: number;
  estado: "Activo" | "Inactivo";
}

export interface ItemCarrito {
  productoId: string;
  clave: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
}

export type TipoMovimientoCaja = "INGRESO" | "EGRESO";

export interface MovimientoCaja {
  id: string;
  concepto: string;
  monto: number;
  tipo: TipoMovimientoCaja;
  fecha: string;
}

export interface VentaPOS {
  id: string;
  folio: string;
  fecha: string;
  items: ItemCarrito[];
  subtotal: number;
  descuento: number;
  iva: number;
  total: number;
}

export interface CorteCaja {
  id: string;
  folio: string;
  fechaApertura: string;
  fechaCierre: string;
  montoInicial: number;
  ventasTurno: number;
  ingresosManual: number;
  egresosManual: number;
  totalCierre: number;
  responsable: string;
}

export const PRODUCTOS_MOCK: Producto[] = [
  {
    id: "PROD-01",
    clave: "ABA-001",
    nombre: "Abarrotes surtidos 1 kg",
    precio: 45.5,
    existencia: 120,
    estado: "Activo",
  },
  {
    id: "PROD-02",
    clave: "BEB-010",
    nombre: "Refresco de cola 600 ml",
    precio: 18,
    existencia: 240,
    estado: "Activo",
  },
  {
    id: "PROD-03",
    clave: "BEB-011",
    nombre: "Agua natural 1 L",
    precio: 12,
    existencia: 300,
    estado: "Activo",
  },
  {
    id: "PROD-04",
    clave: "PAN-020",
    nombre: "Pan de caja grande",
    precio: 38.9,
    existencia: 60,
    estado: "Activo",
  },
  {
    id: "PROD-05",
    clave: "LAC-030",
    nombre: "Leche entera 1 L",
    precio: 27.5,
    existencia: 80,
    estado: "Activo",
  },
  {
    id: "PROD-06",
    clave: "SNK-060",
    nombre: "Botana salada 45 g",
    precio: 16,
    existencia: 200,
    estado: "Activo",
  },
];

export const VENTAS_POS_MOCK: VentaPOS[] = [
  {
    id: "VTA-HIST-001",
    folio: "VTA-78421",
    fecha: "2026-06-30T09:25:00.000Z",
    items: [
      {
        productoId: "PROD-02",
        clave: "BEB-010",
        nombre: "Refresco de cola 600 ml",
        precioUnitario: 18,
        cantidad: 2,
        subtotal: 36,
      },
      {
        productoId: "PROD-05",
        clave: "LAC-030",
        nombre: "Leche entera 1 L",
        precioUnitario: 27.5,
        cantidad: 1,
        subtotal: 27.5,
      },
    ],
    subtotal: 63.5,
    descuento: 5,
    iva: 9.36,
    total: 67.86,
  },
  {
    id: "VTA-HIST-002",
    folio: "VTA-79108",
    fecha: "2026-06-30T11:12:00.000Z",
    items: [
      {
        productoId: "PROD-04",
        clave: "PAN-020",
        nombre: "Pan de caja grande",
        precioUnitario: 38.9,
        cantidad: 1,
        subtotal: 38.9,
      },
      {
        productoId: "PROD-06",
        clave: "SNK-060",
        nombre: "Botana salada 45 g",
        precioUnitario: 16,
        cantidad: 3,
        subtotal: 48,
      },
    ],
    subtotal: 86.9,
    descuento: 0,
    iva: 13.9,
    total: 100.8,
  },
];

export const CORTES_CAJA_MOCK: CorteCaja[] = [
  {
    id: "CORTE-HIST-001",
    folio: "COR-54012",
    fechaApertura: "2026-06-30T08:00:00.000Z",
    fechaCierre: "2026-06-30T16:00:00.000Z",
    montoInicial: 1000,
    ventasTurno: 4230.75,
    ingresosManual: 150,
    egresosManual: 82.5,
    totalCierre: 5298.25,
    responsable: "Supervisor turno matutino",
  },
  {
    id: "CORTE-HIST-002",
    folio: "COR-54089",
    fechaApertura: "2026-06-29T14:00:00.000Z",
    fechaCierre: "2026-06-29T22:00:00.000Z",
    montoInicial: 1200,
    ventasTurno: 3855.2,
    ingresosManual: 200,
    egresosManual: 120,
    totalCierre: 5135.2,
    responsable: "Administrador de caja",
  },
];
