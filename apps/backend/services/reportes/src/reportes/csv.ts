/**
 * Armado de los archivos CSV que descarga el módulo de reportes.
 *
 * Vive aparte del servicio y no toca red ni Nest: recibe los datos ya
 * agregados y devuelve texto. Así el formato del archivo se puede probar sin
 * levantar los cinco servicios de los que se alimenta un reporte.
 */

/** Tipos de reporte que se pueden descargar. */
export const TIPOS_EXPORTABLES = ["ventas", "cotizaciones", "inventario", "cortes"] as const;

export type TipoExportable = (typeof TIPOS_EXPORTABLES)[number];

/** Contenido de un archivo listo para entregarse al navegador. */
export interface ArchivoCsv {
  nombre: string;
  contenido: string;
}

export function esTipoExportable(valor: string): valor is TipoExportable {
  return (TIPOS_EXPORTABLES as readonly string[]).includes(valor);
}

/**
 * Serializa una tabla a CSV. Tres reglas del formato, cada una necesaria:
 *
 * - Celdas entrecomilladas y comillas internas duplicadas: evita que un dato
 *   con comas parta la fila en columnas de más.
 * - Fin de línea CRLF: es lo que pide el formato y lo que Excel espera.
 * - Marca de orden de bytes al inicio: evita que Excel lea el archivo como
 *   ANSI y muestre los acentos rotos.
 */
export function aCsv(encabezados: string[], filas: string[][]): string {
  const escapar = (valor: string) => `"${valor.replaceAll('"', '""')}"`;
  const lineas = [encabezados, ...filas].map((fila) => fila.map(escapar).join(","));
  return `﻿${lineas.join("\r\n")}`;
}

/** Convierte un valor numérico a la cadena que va en la celda. */
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
        // Un turno abierto no tiene cierre; la celda se deja vacía en vez de
        // inventar una fecha o escribir "null" dentro del archivo.
        corte.fechaCierre ?? "",
      ]),
    ),
  };
}
