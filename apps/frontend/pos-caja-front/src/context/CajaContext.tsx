"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { CajaApi, EstadoCajaApi, MovimientoCajaApi } from "../api/posApi";
import { movimientoApiAUi } from "../api/posApi";
import type { MovimientoCaja, TipoMovimientoCajaUi } from "../types/pos";

export type { TipoMovimientoCajaUi as TipoMovimientoCaja };

export interface CajaState {
  cajaAbierta: boolean;
  cajaId: string | null;
  montoInicial: number;
  fechaApertura: string | null;
  movimientos: MovimientoCaja[];
  ventasAcumuladas: number;
}

export interface CajaContextValue extends CajaState {
  hidratarDesdeEstado: (estado: EstadoCajaApi) => void;
  sincronizarApertura: (caja: CajaApi) => void;
  sincronizarMovimiento: (movimiento: MovimientoCajaApi) => void;
  agregarVentaAcumulada: (total: number) => void;
  finalizarTurno: () => void;
}

const CajaContext = createContext<CajaContextValue | null>(null);

export interface CajaProviderProps {
  children: React.ReactNode;
}

export function CajaProvider({ children }: CajaProviderProps) {
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [cajaId, setCajaId] = useState<string | null>(null);
  const [montoInicial, setMontoInicial] = useState(0);
  const [fechaApertura, setFechaApertura] = useState<string | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
  const [ventasAcumuladas, setVentasAcumuladas] = useState(0);

  // Restaura el turno abierto que ya existía en el backend al cargar la página,
  // para que recargar no "pierda" la caja abierta (el estado no vive solo en el navegador).
  const hidratarDesdeEstado = useCallback((estado: EstadoCajaApi) => {
    if (!estado.abierta || !estado.caja) {
      setCajaAbierta(false);
      setCajaId(null);
      setMontoInicial(0);
      setFechaApertura(null);
      setMovimientos([]);
      setVentasAcumuladas(0);
      return;
    }
    setCajaAbierta(true);
    setCajaId(estado.caja.id);
    setMontoInicial(estado.caja.montoInicial);
    setFechaApertura(estado.caja.fechaApertura);
    setMovimientos(estado.movimientos.map(movimientoApiAUi));
    setVentasAcumuladas(estado.ventasTurno);
  }, []);

  const sincronizarApertura = useCallback((caja: CajaApi) => {
    setCajaAbierta(true);
    setCajaId(caja.id);
    setMontoInicial(caja.montoInicial);
    setFechaApertura(caja.fechaApertura);
    setMovimientos([]);
    setVentasAcumuladas(0);
  }, []);

  const sincronizarMovimiento = useCallback((movimiento: MovimientoCajaApi) => {
    setMovimientos((actuales) => [movimientoApiAUi(movimiento), ...actuales]);
  }, []);

  const agregarVentaAcumulada = useCallback((total: number) => {
    setVentasAcumuladas((ventasActuales) => ventasActuales + total);
  }, []);

  const finalizarTurno = useCallback(() => {
    setCajaAbierta(false);
    setCajaId(null);
    setMontoInicial(0);
    setFechaApertura(null);
    setMovimientos([]);
    setVentasAcumuladas(0);
  }, []);

  const value = useMemo<CajaContextValue>(
    () => ({
      cajaAbierta,
      cajaId,
      montoInicial,
      fechaApertura,
      movimientos,
      ventasAcumuladas,
      hidratarDesdeEstado,
      sincronizarApertura,
      sincronizarMovimiento,
      agregarVentaAcumulada,
      finalizarTurno,
    }),
    [
      agregarVentaAcumulada,
      cajaAbierta,
      cajaId,
      fechaApertura,
      finalizarTurno,
      hidratarDesdeEstado,
      montoInicial,
      movimientos,
      sincronizarApertura,
      sincronizarMovimiento,
      ventasAcumuladas,
    ],
  );

  return <CajaContext.Provider value={value}>{children}</CajaContext.Provider>;
}

export function useCaja(): CajaContextValue {
  const context = useContext(CajaContext);

  if (!context) {
    throw new Error("useCaja debe usarse dentro de <CajaProvider>.");
  }

  return context;
}
