import type { ItemCarrito, ModoPos, ProductoPos } from "../types/pos";

/** Tasa de IVA aplicada sobre la base gravable. */
export const IVA = 0.16;

/** Importes de una venta o compra, derivados del carrito y el descuento. */
export interface TotalesCarrito {
  /** Suma de los importes de las partidas, antes de descuento. */
  subtotal: number;
  /** Descuento realmente aplicado: nunca supera al subtotal. */
  descuento: number;
  /** Monto sobre el que se calcula el IVA. */
  baseGravable: number;
  iva: number;
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
 * Importes del carrito. El descuento se recorta al subtotal para que la base
 * gravable nunca sea negativa y el total no se vuelva un reembolso.
 *
 * **Una compra a proveedor no lleva IVA ni descuento.** El servicio la guarda
 * como la suma de cantidad por precio de compra, y su DTO ni siquiera acepta un
 * descuento; aplicar aquí la aritmética de venta haría que la pantalla mostrara
 * un total que la base de datos no tiene.
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
    return { subtotal, descuento: 0, baseGravable: subtotal, iva: 0, total: subtotal };
  }

  const descuento = Math.min(descuentoAplicado, subtotal);
  const baseGravable = Math.max(subtotal - descuento, 0);
  const iva = baseGravable * IVA;
  return { subtotal, descuento, baseGravable, iva, total: baseGravable + iva };
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
