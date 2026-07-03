/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permite consumir el Design System compartido (TypeScript sin compilar).
  transpilePackages: [
    "@scipos/frontend-commons",
    "@scipos/productos-front",
    "@scipos/clientes-front",
  ],
};

export default nextConfig;
