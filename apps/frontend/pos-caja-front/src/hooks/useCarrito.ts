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

export function useCarrito(modo: ModoPos) {
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [descuentoCaptura, setDescuentoCaptura] = useState("0");
  const [descuentoAplicado, setDescuentoAplicado] = useState(0);

  const totales = useMemo(
    () => calcularTotales(carrito, descuentoAplicado, modo),
    [carrito, descuentoAplicado, modo],
  );

  const agregar = (producto: ProductoPos) =>
    setCarrito((actual) => agregarAlCarrito(actual, producto, modo));

  const incrementar = (productoId: string) =>
    setCarrito((actual) => cambiarCantidad(actual, productoId, 1));

  const decrementar = (productoId: string) =>
    setCarrito((actual) => cambiarCantidad(actual, productoId, -1));

  const eliminar = (productoId: string) =>
    setCarrito((actual) => quitarDelCarrito(actual, productoId));

  const aplicarDescuento = (): boolean => {
    const descuento = Number.parseFloat(descuentoCaptura);
    if (Number.isNaN(descuento) || descuento < 0) {
      return false;
    }
    setDescuentoAplicado(Math.min(descuento, totales.subtotal));
    return true;
  };

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
