-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateTable
CREATE TABLE "Rol" (
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "accesoTotal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Rol_pkey" PRIMARY KEY ("clave")
);

-- CreateTable
CREATE TABLE "Privilegio" (
    "clave" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "Privilegio_pkey" PRIMARY KEY ("clave")
);

-- CreateTable
CREATE TABLE "RolPrivilegio" (
    "rolClave" TEXT NOT NULL,
    "privilegioClave" TEXT NOT NULL,

    CONSTRAINT "RolPrivilegio_pkey" PRIMARY KEY ("rolClave","privilegioClave")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'ACTIVO',
    "rolClave" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioPrivilegio" (
    "usuarioId" TEXT NOT NULL,
    "privilegioClave" TEXT NOT NULL,
    "concedido" BOOLEAN NOT NULL,

    CONSTRAINT "UsuarioPrivilegio_pkey" PRIMARY KEY ("usuarioId","privilegioClave")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- AddForeignKey
ALTER TABLE "RolPrivilegio" ADD CONSTRAINT "RolPrivilegio_rolClave_fkey" FOREIGN KEY ("rolClave") REFERENCES "Rol"("clave") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolPrivilegio" ADD CONSTRAINT "RolPrivilegio_privilegioClave_fkey" FOREIGN KEY ("privilegioClave") REFERENCES "Privilegio"("clave") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_rolClave_fkey" FOREIGN KEY ("rolClave") REFERENCES "Rol"("clave") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioPrivilegio" ADD CONSTRAINT "UsuarioPrivilegio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioPrivilegio" ADD CONSTRAINT "UsuarioPrivilegio_privilegioClave_fkey" FOREIGN KEY ("privilegioClave") REFERENCES "Privilegio"("clave") ON DELETE CASCADE ON UPDATE CASCADE;
