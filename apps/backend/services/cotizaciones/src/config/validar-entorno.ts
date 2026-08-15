const ENTERO_POSITIVO = /^\d+$/;

export interface EntornoCotizaciones {
  PORT: string;
  DATABASE_URL: string;
  SEGURIDAD_URL: string;
  CLIENTES_URL: string;
  PRODUCTOS_URL: string;
  VENTAS_CAJA_URL: string;
  IVA_PORCENTAJE: string;
}

export function validarEntorno(config: Record<string, unknown>): EntornoCotizaciones {
  const entorno = {
    PORT: String(config.PORT ?? "4004"),
    DATABASE_URL: String(config.DATABASE_URL ?? ""),
    SEGURIDAD_URL: String(config.SEGURIDAD_URL ?? "http://localhost:4001"),
    CLIENTES_URL: String(config.CLIENTES_URL ?? "http://localhost:4003"),
    PRODUCTOS_URL: String(config.PRODUCTOS_URL ?? "http://localhost:4002"),
    VENTAS_CAJA_URL: String(config.VENTAS_CAJA_URL ?? "http://localhost:4005"),
    IVA_PORCENTAJE: String(config.IVA_PORCENTAJE ?? "16"),
  };

  if (!entorno.DATABASE_URL) {
    throw new Error("La variable DATABASE_URL es obligatoria");
  }

  if (!ENTERO_POSITIVO.test(entorno.PORT) || Number(entorno.PORT) > 65535) {
    throw new Error("PORT debe ser un puerto válido");
  }

  const iva = Number(entorno.IVA_PORCENTAJE);
  if (!Number.isFinite(iva) || iva < 0 || iva > 100) {
    throw new Error("IVA_PORCENTAJE debe estar entre 0 y 100");
  }

  for (const variable of [
    "SEGURIDAD_URL",
    "CLIENTES_URL",
    "PRODUCTOS_URL",
    "VENTAS_CAJA_URL",
  ] as const) {
    try {
      new URL(entorno[variable]);
    } catch {
      throw new Error(`${variable} debe ser una URL válida`);
    }
  }

  return entorno;
}
