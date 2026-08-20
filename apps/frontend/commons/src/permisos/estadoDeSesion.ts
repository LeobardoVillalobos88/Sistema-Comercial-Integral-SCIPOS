"use client";

const PREFIJO = "scipos.ui.";

export function marcarEnSesion(clave: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(`${PREFIJO}${clave}`, "1");
}

export function estaMarcadoEnSesion(clave: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.sessionStorage.getItem(`${PREFIJO}${clave}`) !== null;
}

export function limpiarEstadoDeSesion(): void {
  if (typeof window === "undefined") {
    return;
  }
  const claves: string[] = [];
  for (let i = 0; i < window.sessionStorage.length; i += 1) {
    const clave = window.sessionStorage.key(i);
    if (clave?.startsWith(PREFIJO)) {
      claves.push(clave);
    }
  }
  for (const clave of claves) {
    window.sessionStorage.removeItem(clave);
  }
}
