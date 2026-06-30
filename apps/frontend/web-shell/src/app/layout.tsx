import { AppShell } from "@/components/AppShell";
import type { Metadata } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "SCIPOS: Sistema Comercial Integral",
  description: "Plataforma comercial / POS. Proyecto integrador LOBOSOFT (UTEZ).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
