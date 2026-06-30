import type { Metadata } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "SCIPOS: Microfrontend de ejemplo",
  description: "Plantilla de referencia para los microfrontends de dominio.",
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
