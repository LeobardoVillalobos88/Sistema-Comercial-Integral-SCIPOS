-- Quita el IVA de las ventas.
--
-- Los precios del catálogo ya son los finales al público, así que el total de
-- una venta es el subtotal menos el descuento, sin impuesto que sumar encima.
ALTER TABLE "Venta" DROP COLUMN "iva";
