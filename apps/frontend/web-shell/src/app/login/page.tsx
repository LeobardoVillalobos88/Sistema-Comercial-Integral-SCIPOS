"use client";

import { usePermisos } from "@scipos/frontend-commons";
import { LoginView } from "@scipos/login-front";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { iniciarSesion } = usePermisos();
  const router = useRouter();

  const handleLogin = async (correo: string, contrasena: string) => {
    // iniciarSesion lanza un ErrorApi si falla, el LoginView lo atrapa y lo muestra
    await iniciarSesion(correo, contrasena);
    // Si llegamos aquí, la sesión fue exitosa, redirigimos al dashboard
    router.replace("/dashboard");
  };

  return <LoginView onLogin={handleLogin} />;
}
