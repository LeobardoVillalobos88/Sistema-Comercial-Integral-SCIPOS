-- Quita el IVA de las cotizaciones.
--
-- Los precios del catálogo ya son los finales al público, así que el total de
-- una cotización es su subtotal y la columna dejó de tener sentido. El total
-- guardado no cambia de significado: se recalcula al crear la cotización.
ALTER TABLE "cotizaciones" DROP COLUMN "iva";
