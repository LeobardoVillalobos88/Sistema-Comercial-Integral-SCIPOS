-- AlterTable: credenciales de acceso del usuario
ALTER TABLE "Usuario" ADD COLUMN "contrasenaHash" TEXT NOT NULL DEFAULT '';
