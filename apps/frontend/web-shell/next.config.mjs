/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permite consumir paquetes del workspace sin build previo (TypeScript sin compilar).
  transpilePackages: [
    "@scipos/frontend-commons",
    "@scipos/productos-front",
    "@scipos/clientes-front",
    "@scipos/cotizaciones-front",
    "@scipos/pos-caja-front",
    "@scipos/reportes-front",
  ],
};

export default nextConfig;
