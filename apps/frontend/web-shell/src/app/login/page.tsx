"use client";

import { usePermisos } from "@scipos/frontend-commons";
import { LoginView } from "@scipos/login-front";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { iniciarSesion, usuario, cargandoPermisos } = usePermisos();
  const router = useRouter();

  // Si ya hay sesión (p. ej. se abrió /login con la pestaña autenticada), no
  // mostramos el formulario: directo al tablero.
  useEffect(() => {
    if (!cargandoPermisos && usuario) {
      router.replace("/dashboard");
    }
  }, [cargandoPermisos, usuario, router]);

  const handleLogin = async (correo: string, contrasena: string) => {
    // iniciarSesion lanza un ErrorApi si falla; el LoginView lo atrapa y lo muestra.
    await iniciarSesion(correo, contrasena);
    // Si llegamos aquí la sesión fue exitosa: al tablero.
    router.replace("/dashboard");
  };

  return <LoginView onLogin={handleLogin} />;
}
