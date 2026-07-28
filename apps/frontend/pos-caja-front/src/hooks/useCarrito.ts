"use client";

import { useMemo, useState } from "react";

import {
  agregarAlCarrito,
  calcularTotales,
  cambiarCantidad,
  cantidadEnCarrito,
  quitarDelCarrito,
} from "../calculos/calculos-pos";
import type { ItemCarrito, ModoPos, ProductoPos } from "../types/pos";

/**
 * Estado del carrito y sus importes. Solo administra datos: las validaciones de
 * privilegio, existencia y los avisos al usuario se quedan en la vista, que es
 * la que conoce el contexto de la operación.
 */
export function useCarrito(modo: ModoPos) {
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [descuentoCaptura, setDescuentoCaptura] = useState("0");
  const [descuentoAplicado, setDescuentoAplicado] = useState(0);

  const totales = useMemo(
    () => calcularTotales(carrito, descuentoAplicado),
    [carrito, descuentoAplicado],
  );

  const agregar = (producto: ProductoPos) =>
    setCarrito((actual) => agregarAlCarrito(actual, producto, modo));

  const incrementar = (productoId: string) =>
    setCarrito((actual) => cambiarCantidad(actual, productoId, 1));

  const decrementar = (productoId: string) =>
    setCarrito((actual) => cambiarCantidad(actual, productoId, -1));

  const eliminar = (productoId: string) =>
    setCarrito((actual) => quitarDelCarrito(actual, productoId));

  /** Aplica el descuento recortado al subtotal. Devuelve false si no es un número válido. */
  const aplicarDescuento = (): boolean => {
    const descuento = Number.parseFloat(descuentoCaptura);
    if (Number.isNaN(descuento) || descuento < 0) {
      return false;
    }
    setDescuentoAplicado(Math.min(descuento, totales.subtotal));
    return true;
  };

  /** Vacía el carrito y deja el descuento en cero. */
  const limpiar = () => {
    setCarrito([]);
    setDescuentoAplicado(0);
    setDescuentoCaptura("0");
  };

  return {
    carrito,
    totales,
    descuentoCaptura,
    setDescuentoCaptura,
    descuentoAplicado,
    cantidadDe: (productoId: string) => cantidadEnCarrito(carrito, productoId),
    agregar,
    incrementar,
    decrementar,
    eliminar,
    aplicarDescuento,
    limpiar,
  };
}
