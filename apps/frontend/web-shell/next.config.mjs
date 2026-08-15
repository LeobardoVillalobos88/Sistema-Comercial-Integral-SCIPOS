/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@scipos/frontend-commons",
    "@scipos/productos-front",
    "@scipos/clientes-front",
    "@scipos/cotizaciones-front",
    "@scipos/login-front",
    "@scipos/pos-caja-front",
    "@scipos/reportes-front",
  ],
};

export default nextConfig;
