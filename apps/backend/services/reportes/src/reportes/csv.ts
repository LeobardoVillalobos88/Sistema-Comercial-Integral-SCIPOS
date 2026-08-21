export const TIPOS_EXPORTABLES = ["ventas", "cotizaciones", "inventario", "cortes"] as const;

export type TipoExportable = (typeof TIPOS_EXPORTABLES)[number];

export interface ArchivoCsv {
  nombre: string;
  contenido: string;
}

export function esTipoExportable(valor: string): valor is TipoExportable {
  return (TIPOS_EXPORTABLES as readonly string[]).includes(valor);
}

export function aCsv(encabezados: string[], filas: string[][]): string {
  const escapar = (valor: string) => `"${valor.replaceAll('"', '""')}"`;
  const lineas = [encabezados, ...filas].map((fila) => fila.map(escapar).join(","));
  return `﻿${lineas.join("\r\n")}`;
}

function cifra(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? "" : valor.toFixed(2);
}

interface VentaExportable {
  id: string;
  clienteId: string;
  estado: string;
  descuento: number;
  total: number;
  fecha: string;
}

interface CotizacionExportable {
  folio: string;
  clienteNombre: string;
  estado: string;
  total: number;
  creadaEn: string;
}

interface ProductoExportable {
  nombre: string;
  tipo: string;
  precioCompra: number;
  precioVenta: number;
  existencia: number;
  activo: boolean;
}

interface CorteExportable {
  id: string;
  montoInicial: number;
  montoFinal: number | null;
  fechaApertura: string;
  fechaCierre: string | null;
}

export function csvVentas(ventas: VentaExportable[]): ArchivoCsv {
  return {
    nombre: "reporte-ventas.csv",
    contenido: aCsv(
      ["Folio", "Cliente", "Estado", "Descuento", "Total", "Fecha"],
      ventas.map((venta) => [
        venta.id,
        venta.clienteId,
        venta.estado,
        cifra(venta.descuento),
        cifra(venta.total),
        venta.fecha,
      ]),
    ),
  };
}

export function csvCotizaciones(cotizaciones: CotizacionExportable[]): ArchivoCsv {
  return {
    nombre: "reporte-cotizaciones.csv",
    contenido: aCsv(
      ["Folio", "Cliente", "Estado", "Total", "Creada"],
      cotizaciones.map((cotizacion) => [
        cotizacion.folio,
        cotizacion.clienteNombre,
        cotizacion.estado,
        cifra(cotizacion.total),
        cotizacion.creadaEn,
      ]),
    ),
  };
}

export function csvInventario(productos: ProductoExportable[]): ArchivoCsv {
  return {
    nombre: "reporte-inventario.csv",
    contenido: aCsv(
      ["Nombre", "Tipo", "Precio compra", "Precio venta", "Existencia", "Estado"],
      productos.map((producto) => [
        producto.nombre,
        producto.tipo,
        cifra(producto.precioCompra),
        cifra(producto.precioVenta),
        String(producto.existencia),
        producto.activo ? "ACTIVO" : "INACTIVO",
      ]),
    ),
  };
}

export function csvCortes(cortes: CorteExportable[]): ArchivoCsv {
  return {
    nombre: "reporte-cortes.csv",
    contenido: aCsv(
      ["Corte", "Monto inicial", "Monto final", "Apertura", "Cierre"],
      cortes.map((corte) => [
        corte.id,
        cifra(corte.montoInicial),
        cifra(corte.montoFinal),
        corte.fechaApertura,
        corte.fechaCierre ?? "",
      ]),
    ),
  };
}
