"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type TipoMovimientoCaja = "Ingreso" | "Egreso";

export interface MovimientoCaja {
  id: string;
  concepto: string;
  monto: number;
  tipo: TipoMovimientoCaja;
  fecha: string;
}

export interface CajaState {
  cajaAbierta: boolean;
  montoInicial: number;
  fechaApertura: string | null;
  movimientos: MovimientoCaja[];
  ventasAcumuladas: number;
}

export interface CajaContextValue extends CajaState {
  abrirCaja: (monto: number) => void;
  registrarMovimiento: (concepto: string, monto: number, tipo: TipoMovimientoCaja) => void;
  agregarVentaAcumulada: (total: number) => void;
  cerrarCaja: () => void;
}

const CajaContext = createContext<CajaContextValue | null>(null);

function leerBooleanoPersistido(clave: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(clave) === "true";
}

function leerNumeroPersistido(clave: string): number {
  if (typeof window === "undefined") {
    return 0;
  }

  const valor = window.localStorage.getItem(clave);
  if (valor === null) {
    return 0;
  }

  const numero = Number.parseFloat(valor);
  return Number.isNaN(numero) ? 0 : numero;
}

export interface CajaProviderProps {
  children: React.ReactNode;
}

export function CajaProvider({ children }: CajaProviderProps) {
  const [cajaAbierta, setCajaAbierta] = useState(() => leerBooleanoPersistido("cajaAbierta"));
  const [montoInicial, setMontoInicial] = useState(() => leerNumeroPersistido("montoInicial"));
  const [fechaApertura, setFechaApertura] = useState<string | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
  const [ventasAcumuladas, setVentasAcumuladas] = useState(0);

  useEffect(() => {
    window.localStorage.setItem("cajaAbierta", String(cajaAbierta));
  }, [cajaAbierta]);

  useEffect(() => {
    window.localStorage.setItem("montoInicial", String(montoInicial));
  }, [montoInicial]);

  const abrirCaja = useCallback((monto: number) => {
    if (Number.isNaN(monto) || monto < 0) {
      return;
    }

    setCajaAbierta(true);
    setMontoInicial(monto);
    setFechaApertura(new Date().toISOString());
  }, []);

  const registrarMovimiento = useCallback(
    (concepto: string, monto: number, tipo: TipoMovimientoCaja) => {
      if (!cajaAbierta) {
        return;
      }

      setMovimientos((movimientosActuales) => [
        {
          id: `MOV-${Date.now()}`,
          concepto,
          monto,
          tipo,
          fecha: new Date().toISOString(),
        },
        ...movimientosActuales,
      ]);
    },
    [cajaAbierta],
  );

  const agregarVentaAcumulada = useCallback(
    (total: number) => {
      if (!cajaAbierta) {
        return;
      }

      setVentasAcumuladas((ventasActuales) => ventasActuales + total);
    },
    [cajaAbierta],
  );

  const cerrarCaja = useCallback(() => {
    setCajaAbierta(false);
    setMontoInicial(0);
    setFechaApertura(null);
    setMovimientos([]);
    setVentasAcumuladas(0);
  }, []);

  const value = useMemo<CajaContextValue>(
    () => ({
      cajaAbierta,
      montoInicial,
      fechaApertura,
      movimientos,
      ventasAcumuladas,
      abrirCaja,
      registrarMovimiento,
      agregarVentaAcumulada,
      cerrarCaja,
    }),
    [
      agregarVentaAcumulada,
      abrirCaja,
      cajaAbierta,
      cerrarCaja,
      fechaApertura,
      montoInicial,
      movimientos,
      registrarMovimiento,
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
