"use client";

import {
  COTIZACIONES_MOCK,
  type Cotizacion,
  type PartidaCotizacion,
} from "@scipos/frontend-commons";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { generarFolio } from "../lib/folio";

interface NuevaCotizacionInput {
  clienteId: string;
  partidas: PartidaCotizacion[];
}

interface CotizacionesContextValue {
  cotizaciones: Cotizacion[];
  obtenerPorId: (id: string) => Cotizacion | undefined;
  crearCotizacion: (input: NuevaCotizacionInput) => Cotizacion;
  convertirAVenta: (id: string) => void;
}

const CotizacionesContext = createContext<CotizacionesContextValue | null>(null);

let contadorLocal = 0;

/**
 * Estado en memoria del módulo (equivalente mock al backend del Avance 3).
 * Se inicializa con `COTIZACIONES_MOCK` y vive mientras dure la sesión del navegador.
 */
export function CotizacionesProvider({ children }: { children: React.ReactNode }) {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>(COTIZACIONES_MOCK);

  const crearCotizacion = useCallback(
    (input: NuevaCotizacionInput): Cotizacion => {
      contadorLocal += 1;
      const nueva: Cotizacion = {
        id: `cot-nueva-${contadorLocal}`,
        folio: generarFolio(cotizaciones),
        clienteId: input.clienteId,
        fecha: new Date().toISOString(),
        estado: "BORRADOR",
        partidas: input.partidas,
      };
      setCotizaciones((prev) => [nueva, ...prev]);
      return nueva;
    },
    [cotizaciones],
  );

  const convertirAVenta = useCallback((id: string) => {
    setCotizaciones((prev) =>
      prev.map((cotizacion) =>
        cotizacion.id === id ? { ...cotizacion, estado: "CONVERTIDA" } : cotizacion,
      ),
    );
  }, []);

  const obtenerPorId = useCallback(
    (id: string) => cotizaciones.find((cotizacion) => cotizacion.id === id),
    [cotizaciones],
  );

  const value = useMemo<CotizacionesContextValue>(
    () => ({ cotizaciones, obtenerPorId, crearCotizacion, convertirAVenta }),
    [cotizaciones, obtenerPorId, crearCotizacion, convertirAVenta],
  );

  return <CotizacionesContext.Provider value={value}>{children}</CotizacionesContext.Provider>;
}

export function useCotizaciones(): CotizacionesContextValue {
  const contexto = useContext(CotizacionesContext);
  if (!contexto) {
    throw new Error("useCotizaciones debe usarse dentro de un CotizacionesProvider");
  }
  return contexto;
}
