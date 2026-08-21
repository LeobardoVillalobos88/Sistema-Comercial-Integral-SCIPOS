import type { ItemCarrito, ModoPos, ProductoPos } from "../types/pos";

export interface TotalesCarrito {
  subtotal: number;
  descuento: number;
  total: number;
}

export function precioSegunModo(producto: ProductoPos, modo: ModoPos): number {
  return modo === "compra" ? producto.precioCompra : producto.precioVenta;
}

export function crearItemCarrito(producto: ProductoPos, modo: ModoPos): ItemCarrito {
  const precio = precioSegunModo(producto, modo);
  return {
    productoId: producto.id,
    clave: producto.clave,
    nombre: producto.nombre,
    precioUnitario: precio,
    cantidad: 1,
    subtotal: precio,
  };
}

export function calcularTotales(
  carrito: ItemCarrito[],
  descuentoAplicado: number,
  modo: ModoPos,
): TotalesCarrito {
  const subtotal = carrito.reduce((acumulado, item) => acumulado + item.subtotal, 0);

  if (modo === "compra") {
    return { subtotal, descuento: 0, total: subtotal };
  }

  const descuento = Math.min(descuentoAplicado, subtotal);
  return { subtotal, descuento, total: Math.max(subtotal - descuento, 0) };
}

export function agregarAlCarrito(
  carrito: ItemCarrito[],
  producto: ProductoPos,
  modo: ModoPos,
): ItemCarrito[] {
  const existente = carrito.find((item) => item.productoId === producto.id);
  if (!existente) {
    return [...carrito, crearItemCarrito(producto, modo)];
  }
  return cambiarCantidad(carrito, producto.id, 1);
}

export function cambiarCantidad(
  carrito: ItemCarrito[],
  productoId: string,
  delta: number,
): ItemCarrito[] {
  return carrito
    .map((item) => {
      if (item.productoId !== productoId) {
        return item;
      }
      const cantidad = item.cantidad + delta;
      return { ...item, cantidad, subtotal: cantidad * item.precioUnitario };
    })
    .filter((item) => item.cantidad > 0);
}

export function quitarDelCarrito(carrito: ItemCarrito[], productoId: string): ItemCarrito[] {
  return carrito.filter((item) => item.productoId !== productoId);
}

export function cantidadEnCarrito(carrito: ItemCarrito[], productoId: string): number {
  return carrito.find((item) => item.productoId === productoId)?.cantidad ?? 0;
}
