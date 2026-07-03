import type { Metadata } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "SCIPOS: Cotizaciones",
  description: "Cotizaciones, historial por cliente y conversión a venta.",
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
