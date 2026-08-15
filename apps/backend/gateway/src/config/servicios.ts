export interface ServicioEnrutado {
  ruta: string;
  nombre: string;
  url: string;
}

export function serviciosEnrutados(): ServicioEnrutado[] {
  return [
    {
      ruta: "seguridad",
      nombre: "Servicio de seguridad (usuarios, roles y privilegios)",
      url: process.env.SEGURIDAD_URL ?? "http://localhost:4001",
    },
    {
      ruta: "productos",
      nombre: "Servicio de productos, inventario y compras",
      url: process.env.PRODUCTOS_URL ?? "http://localhost:4002",
    },
    {
      ruta: "clientes",
      nombre: "Servicio de clientes",
      url: process.env.CLIENTES_URL ?? "http://localhost:4003",
    },
    {
      ruta: "cotizaciones",
      nombre: "Servicio de cotizaciones",
      url: process.env.COTIZACIONES_URL ?? "http://localhost:4004",
    },
    {
      ruta: "ventas-caja",
      nombre: "Servicio de ventas POS y caja",
      url: process.env.VENTAS_CAJA_URL ?? "http://localhost:4005",
    },
    {
      ruta: "reportes",
      nombre: "Servicio de reportes y utilidad",
      url: process.env.REPORTES_URL ?? "http://localhost:4006",
    },
  ];
}

export function origenesPermitidos(): string[] {
  const declarados = (process.env.ORIGENES_PERMITIDOS ?? "")
    .split(",")
    .map((origen) => origen.trim())
    .filter((origen) => origen.length > 0);

  if (declarados.length > 0) return declarados;

  const puertos = [3001, 3002, 3003, 3004, 3005, 3006, 3007];
  return puertos.flatMap((puerto) => [`http://localhost:${puerto}`, `http://127.0.0.1:${puerto}`]);
}
