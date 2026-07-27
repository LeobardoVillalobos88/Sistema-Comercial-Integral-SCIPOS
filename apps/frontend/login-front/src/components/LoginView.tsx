import { useState } from "react";
import styles from "./LoginView.module.css";
import { LogIn, User, Lock, Loader2 } from "lucide-react";

export interface LoginViewProps {
  onLogin: (correo: string, contrasena: string) => Promise<void>;
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await onLogin(correo, contrasena);
    } catch (err: any) {
      setError(err.message || "Credenciales inválidas. Intente de nuevo.");
      setCargando(false);
    }
  };

  return (
    <div className={styles.splitContainer}>
      {/* Mitad izquierda: Información y Marca */}
      <div className={styles.brandSide}>
        <div className={styles.brandContent}>
          <h1 className={styles.brandTitle}>SCIPOS</h1>
          <p className={styles.brandSubtitle}>Sistema Comercial Integral</p>
        </div>
      </div>
      
      {/* Mitad derecha: Formulario de Login */}
      <div className={styles.formSide}>
        <div className={styles.formWrapper}>
          <h2 className={styles.formTitle}>Bienvenido</h2>
          <p className={styles.formSubtitle}>Ingresa tus credenciales para continuar</p>

          {error && (
            <div className={styles.errorBox}>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <User size={20} className={styles.inputIcon} />
              <input
                type="email"
                placeholder="Correo electrónico"
                className={styles.input}
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
                disabled={cargando}
              />
            </div>

            <div className={styles.inputGroup}>
              <Lock size={20} className={styles.inputIcon} />
              <input
                type="password"
                placeholder="Contraseña"
                className={styles.input}
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                required
                disabled={cargando}
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={cargando}>
              {cargando ? (
                <Loader2 size={22} className={styles.spinner} />
              ) : (
                <>
                  <LogIn size={20} />
                  <span>Ingresar al Sistema</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
