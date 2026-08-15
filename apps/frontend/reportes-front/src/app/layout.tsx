import type { Metadata } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "SCIPOS: Reportes",
  description: "Reportes comerciales: ventas, cotizaciones, inventario, cortes y utilidad.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
