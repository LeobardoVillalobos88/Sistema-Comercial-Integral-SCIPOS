"use client";

import {
  ESMALTE,
  PLANO,
  estaMarcadoEnSesion,
  formatearFechaCalendario,
  llamarApi,
  marcarEnSesion,
  usePermisos,
} from "@scipos/frontend-commons";
import { alertaDetallada, escaparHtml } from "@scipos/frontend-commons/feedback";
import { useEffect, useRef } from "react";

/** Bandera de sesión: el aviso se da una vez por entrada, no en cada recarga. */
const CLAVE_AVISADO = "alertas-inventario";

interface AlertaCaducidad {
  id: string;
  nombre: string;
  lote: string;
  fechaCaducidad: string;
  diasRestantes: number;
  severidad: "VENCIDO" | "POR_VENCER";
}

interface AlertaStock {
  id: string;
  nombre: string;
  lote: string;
  existencia: number;
  severidad: "AGOTADO" | "BAJO";
}

interface RespuestaAlertas {
  total: number;
  umbrales: { stockBajo: number; diasCaducidad: number };
  caducidad: AlertaCaducidad[];
  stock: AlertaStock[];
}

export interface AlertasInventarioProps {
  /** Lleva al catálogo de productos. Lo provee el armazón, que es quien rutea. */
  onVerProductos?: () => void;
}

/** Cuánto falta (o hace cuánto se pasó), dicho como lo diría una persona. */
function plazoEnPalabras(dias: number): string {
  if (dias < -1) {
    return `venció hace ${Math.abs(dias)} días`;
  }
  if (dias === -1) {
    return "venció ayer";
  }
  if (dias === 0) {
    return "vence hoy";
  }
  if (dias === 1) {
    return "vence mañana";
  }
  return `vence en ${dias} días`;
}

function renglon(titulo: string, detalle: string, urgente: boolean): string {
  const color = urgente ? ESMALTE.rojo : ESMALTE.ocre;
  return `
    <li style="display:flex;align-items:baseline;gap:.6rem;padding:.4rem 0;
               border-bottom:1px solid ${PLANO.regla};text-align:left">
      <span style="flex:0 0 6px;height:6px;background:${color};border-radius:50%"></span>
      <span style="flex:1"><strong>${titulo}</strong></span>
      <span style="color:${color};font-weight:700;white-space:nowrap">${detalle}</span>
    </li>`;
}

function seccion(titulo: string, renglones: string[]): string {
  if (renglones.length === 0) {
    return "";
  }
  return `
    <p style="margin:1rem 0 .25rem;text-align:left;font-weight:800;
              text-transform:uppercase;letter-spacing:.09em;font-size:.75rem;
              color:${PLANO.tintaSuave}">${titulo}</p>
    <ul style="list-style:none;margin:0;padding:0;font-size:.875rem">${renglones.join("")}</ul>`;
}

/**
 * Aviso de inventario al entrar al sistema: lo que ya venció o está por vencer,
 * y lo que se agotó o está por agotarse.
 *
 * Se muestra una sola vez por sesión. Cerrar sesión limpia la bandera, así que
 * quien vuelve a entrar lo recibe de nuevo; recargar la página no vuelve a
 * interrumpirlo.
 *
 * Va en un modal y no en toasts a propósito: con veinte productos vencidos,
 * veinte notificaciones apiladas no se leen.
 */
export function AlertasInventario({ onVerProductos }: AlertasInventarioProps) {
  const { can, usuario, cargandoPermisos } = usePermisos();
  // Evita que el modal se dispare dos veces con el montaje doble de React.
  const yaLanzado = useRef(false);

  useEffect(() => {
    if (cargandoPermisos || !usuario || !can("productos:ver")) {
      return;
    }
    if (yaLanzado.current || estaMarcadoEnSesion(CLAVE_AVISADO)) {
      return;
    }
    yaLanzado.current = true;

    // Sin bandera de "sigo montado" a propósito: la referencia de arriba ya
    // garantiza una sola ejecución, y en modo estricto React monta, desmonta y
    // vuelve a montar. Descartar el resultado al desmontar tiraba justo la
    // petición buena, y el aviso no aparecía nunca. El modal vive fuera de React,
    // así que abrirlo tras un desmontaje no deja nada colgando.
    (async () => {
      let alertas: RespuestaAlertas;
      try {
        alertas = await llamarApi<RespuestaAlertas>("/productos/productos/alertas");
      } catch {
        // Un aviso que no se pudo cargar no debe estropearle la entrada a nadie.
        // Sin marcar la bandera: el siguiente intento vuelve a probar.
        yaLanzado.current = false;
        return;
      }
      marcarEnSesion(CLAVE_AVISADO);
      if (alertas.total === 0) {
        return;
      }

      const porCaducar = alertas.caducidad.map((alerta) =>
        renglon(
          `${escaparHtml(alerta.nombre)} <span style="color:${PLANO.tintaSuave}">· lote ${escaparHtml(
            alerta.lote,
          )} · ${escaparHtml(formatearFechaCalendario(alerta.fechaCaducidad))}</span>`,
          plazoEnPalabras(alerta.diasRestantes),
          alerta.severidad === "VENCIDO",
        ),
      );
      const porAgotarse = alertas.stock.map((alerta) =>
        renglon(
          `${escaparHtml(alerta.nombre)} <span style="color:${PLANO.tintaSuave}">· lote ${escaparHtml(
            alerta.lote,
          )}</span>`,
          alerta.severidad === "AGOTADO" ? "agotado" : `quedan ${alerta.existencia}`,
          alerta.severidad === "AGOTADO",
        ),
      );

      const html = `
        <p style="margin:0;text-align:left;color:${PLANO.tintaSuave}">
          Esto es lo que necesita tu atención en el inventario.
        </p>
        ${seccion("Caducidad", porCaducar)}
        ${seccion("Existencias", porAgotarse)}`;

      const irAProductos = await alertaDetallada({
        titulo: "Revisa tu inventario",
        html,
        icono: "warning",
        confirmar: "Ir a Productos",
        cancelar: "Entendido",
      });
      if (irAProductos) {
        onVerProductos?.();
      }
    })();
  }, [can, usuario, cargandoPermisos, onVerProductos]);

  // No pinta nada: su salida es el modal.
  return null;
}
