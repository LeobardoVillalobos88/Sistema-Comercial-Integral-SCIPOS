"use client";

/**
 * Estado de interfaz que dura lo que dura la sesión de la pestaña: banderas del
 * tipo "esto ya se le mostró al usuario en esta entrada". Vive en
 * sessionStorage bajo un prefijo propio para poder borrarse de un golpe al
 * cerrar sesión, sin que el proveedor de permisos tenga que conocer qué
 * guardó cada módulo.
 */

const PREFIJO = "scipos.ui.";

/** Marca una bandera de interfaz para el resto de la sesión. */
export function marcarEnSesion(clave: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(`${PREFIJO}${clave}`, "1");
}

/** Indica si la bandera ya se marcó en esta sesión. */
export function estaMarcadoEnSesion(clave: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.sessionStorage.getItem(`${PREFIJO}${clave}`) !== null;
}

/**
 * Borra todas las banderas de interfaz. Se llama al cerrar sesión, para que
 * quien vuelva a entrar reciba de nuevo lo que se muestra una vez por sesión.
 */
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
