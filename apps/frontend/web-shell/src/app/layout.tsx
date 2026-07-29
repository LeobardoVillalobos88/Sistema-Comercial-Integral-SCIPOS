import { AppShell } from "@/components/AppShell";
import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { Providers } from "./providers";

/**
 * La voz del rotulista. Una sola familia sostiene el sistema: el peso hace la
 * jerarquía. Se pide como fuente variable —sin lista de pesos— para que sea un
 * solo archivo con todo el rango. Se auto-hospeda, así que no sale una petición
 * a un servidor de fuentes en tiempo de ejecución.
 */
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--fuente-rotulo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SCIPOS: Sistema Comercial Integral",
  description: "Plataforma comercial / POS. Proyecto integrador LOBOSOFT (UTEZ).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={archivo.variable}>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
