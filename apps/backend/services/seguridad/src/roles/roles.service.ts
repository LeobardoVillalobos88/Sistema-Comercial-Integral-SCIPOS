import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PrivilegiosService } from "../privilegios/privilegios.service";

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly privilegios: PrivilegiosService,
  ) {}

  async listar() {
    const roles = await this.prisma.rol.findMany({
      include: { privilegios: { select: { privilegioClave: true } } },
      orderBy: { clave: "asc" },
    });
    return roles.map((rol) => ({
      clave: rol.clave,
      nombre: rol.nombre,
      accesoTotal: rol.accesoTotal,
      privilegios: rol.privilegios.map((p) => p.privilegioClave).sort(),
    }));
  }

  async asignarPrivilegio(rolClave: string, privilegioClave: string) {
    await this.validarRol(rolClave);
    await this.validarPrivilegio(privilegioClave);
    const asignacion = await this.prisma.rolPrivilegio.upsert({
      where: { rolClave_privilegioClave: { rolClave, privilegioClave } },
      update: {},
      create: { rolClave, privilegioClave },
    });
    await this.privilegios.invalidarRol(rolClave);
    return asignacion;
  }

  async revocarPrivilegio(rolClave: string, privilegioClave: string) {
    await this.validarRol(rolClave);
    await this.prisma.rolPrivilegio.deleteMany({ where: { rolClave, privilegioClave } });
    await this.privilegios.invalidarRol(rolClave);
    return { rolClave, privilegioClave, revocado: true };
  }

  private async validarRol(clave: string) {
    const rol = await this.prisma.rol.findUnique({ where: { clave } });
    if (!rol) {
      throw new NotFoundException(`El rol "${clave}" no existe.`);
    }
  }

  private async validarPrivilegio(clave: string) {
    const privilegio = await this.prisma.privilegio.findUnique({ where: { clave } });
    if (!privilegio) {
      throw new NotFoundException(`El privilegio "${clave}" no existe en el catálogo.`);
    }
  }
}
