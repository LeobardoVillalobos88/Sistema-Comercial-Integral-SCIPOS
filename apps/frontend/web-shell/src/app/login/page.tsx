"use client";

import { usePermisos } from "@scipos/frontend-commons";
import { LoginView } from "@scipos/login-front";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { iniciarSesion, usuario, cargandoPermisos } = usePermisos();
  const router = useRouter();

  useEffect(() => {
    if (!cargandoPermisos && usuario) {
      router.replace("/dashboard");
    }
  }, [cargandoPermisos, usuario, router]);

  const handleLogin = async (correo: string, contrasena: string) => {
    await iniciarSesion(correo, contrasena);
    router.replace("/dashboard");
  };

  return <LoginView onLogin={handleLogin} />;
}
