"use client";

import { llamarApi, usePermisos } from "@scipos/frontend-commons";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CotizacionApi, CrearCotizacionApi } from "../tipos";

interface CotizacionesContextValue {
  cotizaciones: CotizacionApi[];
  cargando: boolean;
  errorCarga: string | null;
  recargar: () => Promise<void>;
  obtenerPorId: (id: string) => CotizacionApi | undefined;
  crearCotizacion: (input: CrearCotizacionApi) => Promise<CotizacionApi>;
  marcarEnviada: (id: string) => Promise<CotizacionApi>;
  convertirAVenta: (id: string) => Promise<CotizacionApi>;
  eliminar: (id: string) => Promise<void>;
}

const CotizacionesContext = createContext<CotizacionesContextValue | null>(null);

export function CotizacionesProvider({ children }: { children: React.ReactNode }) {
  const { usuario, cargandoPermisos } = usePermisos();
  const [cotizaciones, setCotizaciones] = useState<CotizacionApi[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const lista = await llamarApi<CotizacionApi[]>("/cotizaciones/cotizaciones");
      setCotizaciones(lista);
    } catch (error) {
      setCotizaciones([]);
      setErrorCarga(
        error instanceof Error ? error.message : "No se pudieron cargar las cotizaciones.",
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (cargandoPermisos) {
      return;
    }
    if (!usuario) {
      setCotizaciones([]);
      setErrorCarga("No fue posible identificar al usuario activo contra seguridad.");
      setCargando(false);
      return;
    }
    void recargar();
  }, [cargandoPermisos, usuario, recargar]);

  const actualizarEnLista = useCallback((actualizada: CotizacionApi) => {
    setCotizaciones((prev) =>
      prev.map((cotizacion) => (cotizacion.id === actualizada.id ? actualizada : cotizacion)),
    );
  }, []);

  const crearCotizacion = useCallback(async (input: CrearCotizacionApi): Promise<CotizacionApi> => {
    const nueva = await llamarApi<CotizacionApi>("/cotizaciones/cotizaciones", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setCotizaciones((prev) => [nueva, ...prev]);
    return nueva;
  }, []);

  const marcarEnviada = useCallback(
    async (id: string): Promise<CotizacionApi> => {
      const actualizada = await llamarApi<CotizacionApi>(
        `/cotizaciones/cotizaciones/${id}/enviar`,
        { method: "PATCH" },
      );
      actualizarEnLista(actualizada);
      return actualizada;
    },
    [actualizarEnLista],
  );

  const convertirAVenta = useCallback(
    async (id: string): Promise<CotizacionApi> => {
      const actualizada = await llamarApi<CotizacionApi>(
        `/cotizaciones/cotizaciones/${id}/convertir`,
        { method: "POST" },
      );
      actualizarEnLista(actualizada);
      return actualizada;
    },
    [actualizarEnLista],
  );

  const obtenerPorId = useCallback(
    (id: string) => cotizaciones.find((cotizacion) => cotizacion.id === id),
    [cotizaciones],
  );

  const eliminar = useCallback(async (id: string): Promise<void> => {
    await llamarApi<CotizacionApi>(`/cotizaciones/cotizaciones/${id}`, {
      method: "DELETE",
    });
    setCotizaciones((prev) => prev.filter((cotizacion) => cotizacion.id !== id));
  }, []);

  const value = useMemo<CotizacionesContextValue>(
    () => ({
      cotizaciones,
      cargando,
      errorCarga,
      recargar,
      obtenerPorId,
      crearCotizacion,
      marcarEnviada,
      convertirAVenta,
      eliminar,
    }),
    [
      cotizaciones,
      cargando,
      errorCarga,
      recargar,
      obtenerPorId,
      crearCotizacion,
      marcarEnviada,
      convertirAVenta,
      eliminar,
    ],
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
