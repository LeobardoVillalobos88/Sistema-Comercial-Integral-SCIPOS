import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashSync } from "bcryptjs";
import { PrismaClient } from ".prisma/client";

/**
 * Semilla del servicio de seguridad. Es idempotente: se puede correr las
 * veces que haga falta sin duplicar datos.
 *
 * Carga el catálogo de privilegios `modulo:accion`, la matriz de privilegios
 * por rol (la misma que usa el frontend en commons/permisos) y un usuario
 * semilla por cada rol para operar el sistema sin registro de usuarios.
 */

const CATALOGO_PRIVILEGIOS: Array<{ clave: string; descripcion: string }> = [
  { clave: "productos:ver", descripcion: "Ver el catálogo de productos y servicios" },
  { clave: "productos:crear", descripcion: "Registrar productos y servicios" },
  { clave: "productos:editar", descripcion: "Editar productos y servicios" },
  { clave: "productos:desactivar", descripcion: "Activar o desactivar productos" },
  { clave: "productos:eliminar", descripcion: "Eliminar productos definitivamente" },
  { clave: "clientes:ver", descripcion: "Ver la lista y el detalle de clientes" },
  { clave: "clientes:crear", descripcion: "Registrar clientes" },
  { clave: "clientes:editar", descripcion: "Editar y activar/desactivar clientes" },
  { clave: "clientes:eliminar", descripcion: "Eliminar clientes definitivamente" },
  { clave: "cotizaciones:ver", descripcion: "Ver cotizaciones y su historial" },
  { clave: "cotizaciones:crear", descripcion: "Crear cotizaciones" },
  { clave: "cotizaciones:enviar", descripcion: "Marcar cotizaciones como enviadas" },
  { clave: "cotizaciones:convertir", descripcion: "Convertir cotizaciones en ventas" },
  { clave: "cotizaciones:eliminar", descripcion: "Eliminar cotizaciones" },
  { clave: "pos:ver", descripcion: "Ver el punto de venta" },
  { clave: "pos:vender", descripcion: "Realizar ventas desde el punto de venta" },
  { clave: "pos:descuento", descripcion: "Aplicar descuentos en ventas" },
  { clave: "pos:cancelar", descripcion: "Cancelar ventas" },
  { clave: "compras:ver", descripcion: "Ver y registrar compras a proveedores" },
  { clave: "caja:ver", descripcion: "Ver el estado de la caja" },
  { clave: "caja:abrir", descripcion: "Abrir la caja" },
  { clave: "caja:movimiento", descripcion: "Registrar ingresos y egresos de caja" },
  { clave: "caja:cerrar", descripcion: "Cerrar la caja y generar el corte" },
  { clave: "reportes:ver", descripcion: "Consultar reportes comerciales" },
  { clave: "seguridad:ver", descripcion: "Ver la administración de usuarios" },
  { clave: "seguridad:crear", descripcion: "Registrar usuarios del sistema" },
  { clave: "seguridad:editar", descripcion: "Editar usuarios del sistema" },
  { clave: "seguridad:eliminar", descripcion: "Eliminar usuarios definitivamente" },
  { clave: "seguridad:asignar", descripcion: "Asignar o revocar privilegios a roles y usuarios" },
];

const ROLES: Array<{ clave: string; nombre: string; accesoTotal: boolean }> = [
  { clave: "ADMINISTRADOR", nombre: "Administrador", accesoTotal: true },
  { clave: "VENDEDOR", nombre: "Vendedor", accesoTotal: false },
  { clave: "CAJERO", nombre: "Cajero", accesoTotal: false },
  { clave: "SUPERVISOR", nombre: "Supervisor", accesoTotal: false },
];

/** Matriz de privilegios por rol (equivalente a MATRIZ_PRIVILEGIOS del frontend). */
const MATRIZ_ROLES: Record<string, string[]> = {
  ADMINISTRADOR: [],
  VENDEDOR: [
    "productos:ver",
    "clientes:ver",
    "clientes:crear",
    "clientes:editar",
    "cotizaciones:ver",
    "cotizaciones:crear",
    "cotizaciones:enviar",
    "cotizaciones:convertir",
    "pos:ver",
    "pos:vender",
  ],
  CAJERO: [
    "productos:ver",
    "clientes:ver",
    "pos:ver",
    "pos:vender",
    "caja:ver",
    "caja:abrir",
    "caja:movimiento",
    "caja:cerrar",
  ],
  SUPERVISOR: [
    "productos:ver",
    "productos:crear",
    "productos:editar",
    "productos:desactivar",
    "clientes:ver",
    "cotizaciones:ver",
    "pos:ver",
    "pos:descuento",
    "pos:cancelar",
    "compras:ver",
    "caja:ver",
    "caja:cerrar",
    "reportes:ver",
  ],
};

/**
 * Usuarios semilla, uno por rol, con IDs fijos y credenciales de demostración
 * conocidas por todo el equipo (misma tabla que CREDENCIALES_DEMO del frontend).
 */
const USUARIOS_SEMILLA = [
  {
    id: "usuario-administrador",
    nombre: "Administrador General",
    correo: "admin@scipos.com",
    contrasena: "Admin1234",
    rolClave: "ADMINISTRADOR",
  },
  {
    id: "usuario-vendedor",
    nombre: "Vendedor de Mostrador",
    correo: "vendedor@scipos.com",
    contrasena: "Vendedor1234",
    rolClave: "VENDEDOR",
  },
  {
    id: "usuario-cajero",
    nombre: "Cajero Principal",
    correo: "cajero@scipos.com",
    contrasena: "Cajero1234",
    rolClave: "CAJERO",
  },
  {
    id: "usuario-supervisor",
    nombre: "Supervisor de Tienda",
    correo: "supervisor@scipos.com",
    contrasena: "Supervisor1234",
    rolClave: "SUPERVISOR",
  },
];

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  // El adapter de pg no lee el parámetro ?schema= de la URL; hay que pasarlo aparte.
  const schema = new URL(url).searchParams.get("schema") ?? undefined;
  const adapter = new PrismaPg({ connectionString: url }, schema ? { schema } : undefined);
  const prisma = new PrismaClient({ adapter });

  for (const privilegio of CATALOGO_PRIVILEGIOS) {
    await prisma.privilegio.upsert({
      where: { clave: privilegio.clave },
      update: { descripcion: privilegio.descripcion },
      create: privilegio,
    });
  }

  for (const rol of ROLES) {
    await prisma.rol.upsert({
      where: { clave: rol.clave },
      update: { nombre: rol.nombre, accesoTotal: rol.accesoTotal },
      create: rol,
    });
    for (const privilegioClave of MATRIZ_ROLES[rol.clave] ?? []) {
      await prisma.rolPrivilegio.upsert({
        where: {
          rolClave_privilegioClave: { rolClave: rol.clave, privilegioClave },
        },
        update: {},
        create: { rolClave: rol.clave, privilegioClave },
      });
    }
  }

  for (const usuario of USUARIOS_SEMILLA) {
    const datos = {
      nombre: usuario.nombre,
      correo: usuario.correo,
      rolClave: usuario.rolClave,
      contrasenaHash: hashSync(usuario.contrasena, 10),
    };
    await prisma.usuario.upsert({
      where: { id: usuario.id },
      update: datos,
      create: { id: usuario.id, ...datos },
    });
  }

  const totales = {
    privilegios: await prisma.privilegio.count(),
    roles: await prisma.rol.count(),
    usuarios: await prisma.usuario.count(),
  };
  console.log("Semilla de seguridad aplicada:", totales);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Error al aplicar la semilla de seguridad:", error);
  process.exit(1);
});
