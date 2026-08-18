"use client";

import { CONTENIDO_ERROR } from "@scipos/frontend-commons";
import { useEffect } from "react";

export default function ErrorGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const contenido = CONTENIDO_ERROR[500];

  return (
    <html lang="es-MX">
      <body style={{ margin: 0 }}>
        <main
          style={{
            minHeight: "100vh",
            backgroundColor: "#101F52",
            color: "#FFFFFF",
            fontFamily: "'Archivo', system-ui, sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
        >
          <div style={{ maxWidth: 620, width: "100%" }}>
            <p
              aria-hidden
              style={{
                margin: 0,
                fontWeight: 900,
                color: "#D98A00",
                fontSize: "clamp(5rem, 20vw, 10rem)",
                lineHeight: 0.82,
                letterSpacing: "-0.04em",
                textShadow: "3px 3px 0 #060F33",
              }}
            >
              500
            </p>
            <div style={{ width: 72, height: 6, backgroundColor: "#D98A00", margin: "1.5rem 0" }} />
            <h1 style={{ margin: "0 0 0.75rem", fontSize: "2rem", fontWeight: 800 }}>
              {contenido.titulo}
            </h1>
            <p style={{ margin: 0, color: "#AAB7DE", maxWidth: "48ch", lineHeight: 1.55 }}>
              {contenido.descripcion}
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: "2rem",
                border: "none",
                cursor: "pointer",
                backgroundColor: "#D98A00",
                color: "#0E1420",
                fontFamily: "inherit",
                fontWeight: 800,
                fontSize: "0.8125rem",
                letterSpacing: "0.11em",
                textTransform: "uppercase",
                padding: "0.75rem 1.5rem",
                borderRadius: 2,
              }}
            >
              Reintentar
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
