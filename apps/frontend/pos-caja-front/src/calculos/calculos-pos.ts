import type { ItemCarrito, ModoPos, ProductoPos } from "../types/pos";

/** Importes de una venta o compra, derivados del carrito y el descuento. */
export interface TotalesCarrito {
  /** Suma de los importes de las partidas, antes de descuento. */
  subtotal: number;
  /** Descuento realmente aplicado: nunca supera al subtotal. */
  descuento: number;
  total: number;
}

/** En compra manda el precio de compra; en venta, el de venta. */
export function precioSegunModo(producto: ProductoPos, modo: ModoPos): number {
  return modo === "compra" ? producto.precioCompra : producto.precioVenta;
}

/** Primera partida de un producto, con cantidad uno. */
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

/**
 * Importes del carrito. El descuento se recorta al subtotal para que el total
 * nunca se vuelva un reembolso.
 *
 * Los precios del catálogo son los finales al público, así que no se suma
 * impuesto encima. **Una compra a proveedor tampoco admite descuento**: su DTO
 * ni siquiera tiene ese campo, y aplicarlo mostraría un total que la base no
 * tiene.
 *
 * Estos importes son los que se muestran en pantalla. El backend vuelve a
 * calcular el precio de cada partida desde el catálogo al registrar la
 * operación, así que aquí no se decide cuánto se cobra.
 */
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

/** Agrega el producto al carrito, o suma uno si ya estaba. */
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

/**
 * Suma o resta unidades a una partida y recalcula su importe. Las partidas que
 * quedan en cero o menos salen del carrito.
 */
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

/** Quita por completo la partida de un producto. */
export function quitarDelCarrito(carrito: ItemCarrito[], productoId: string): ItemCarrito[] {
  return carrito.filter((item) => item.productoId !== productoId);
}

/** Unidades de un producto que ya están en el carrito. */
export function cantidadEnCarrito(carrito: ItemCarrito[], productoId: string): number {
  return carrito.find((item) => item.productoId === productoId)?.cantidad ?? 0;
}
