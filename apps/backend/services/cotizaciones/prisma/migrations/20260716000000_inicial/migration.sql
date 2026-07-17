CREATE TYPE "EstadoCotizacion" AS ENUM ('BORRADOR', 'ENVIADA', 'VENDIDA');

CREATE TABLE "secuencias_folio" (
    "clave" VARCHAR(40) NOT NULL,
    "ultimo" INTEGER NOT NULL,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "secuencias_folio_pkey" PRIMARY KEY ("clave")
);

CREATE TABLE "cotizaciones" (
    "id" VARCHAR(40) NOT NULL,
    "folio" VARCHAR(20) NOT NULL,
    "cliente_id" VARCHAR(40) NOT NULL,
    "cliente_nombre" VARCHAR(180) NOT NULL,
    "estado" "EstadoCotizacion" NOT NULL DEFAULT 'BORRADOR',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "iva" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "venta_id" VARCHAR(40),
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizada_en" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "cotizaciones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "partidas_cotizacion" (
    "id" VARCHAR(40) NOT NULL,
    "cotizacion_id" VARCHAR(40) NOT NULL,
    "producto_id" VARCHAR(40) NOT NULL,
    "producto_nombre" VARCHAR(180) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(12,2) NOT NULL,
    "importe" DECIMAL(12,2) NOT NULL,
    CONSTRAINT "partidas_cotizacion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cotizaciones_folio_key" ON "cotizaciones"("folio");
CREATE UNIQUE INDEX "cotizaciones_venta_id_key" ON "cotizaciones"("venta_id");
CREATE INDEX "cotizaciones_cliente_id_creada_en_idx" ON "cotizaciones"("cliente_id", "creada_en");
CREATE INDEX "cotizaciones_estado_creada_en_idx" ON "cotizaciones"("estado", "creada_en");
CREATE INDEX "partidas_cotizacion_cotizacion_id_idx" ON "partidas_cotizacion"("cotizacion_id");

ALTER TABLE "partidas_cotizacion"
ADD CONSTRAINT "partidas_cotizacion_cotizacion_id_fkey"
FOREIGN KEY ("cotizacion_id") REFERENCES "cotizaciones"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
