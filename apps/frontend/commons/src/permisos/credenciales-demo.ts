import type { Rol } from "./tipos";

/**
 * Credenciales de los usuarios semilla. El selector de rol del topbar las usa
 * para iniciar sesión real contra la API: al elegir un rol, todo el tráfico
 * viaja con el token JWT de ese usuario. Son datos de demostración locales,
 * no secretos de producción.
 */
export const CREDENCIALES_DEMO: Record<Rol, { correo: string; contrasena: string }> = {
  ADMINISTRADOR: { correo: "admin@scipos.com", contrasena: "Admin1234" },
  VENDEDOR: { correo: "vendedor@scipos.com", contrasena: "Vendedor1234" },
  CAJERO: { correo: "cajero@scipos.com", contrasena: "Cajero1234" },
  SUPERVISOR: { correo: "supervisor@scipos.com", contrasena: "Supervisor1234" },
};
