import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { UsuarioSesion } from "@scipos/backend-commons";
import { PrismaService } from "../prisma/prisma.service";
import { PrivilegiosService } from "../privilegios/privilegios.service";
import type { ActualizarUsuarioDto } from "./dto/actualizar-usuario.dto";
import type { AjustarPrivilegioUsuarioDto } from "./dto/ajustar-privilegio-usuario.dto";
import type { CrearUsuarioDto } from "./dto/crear-usuario.dto";

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly privilegios: PrivilegiosService,
  ) {}

  async listar(): Promise<UsuarioSesion[]> {
    const usuarios = await this.prisma.usuario.findMany({
      orderBy: [{ rolClave: "asc" }, { nombre: "asc" }],
    });
    return usuarios.map((usuario) => this.aSesion(usuario));
  }

  async obtener(id: string): Promise<UsuarioSesion> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      throw new NotFoundException(`El usuario "${id}" no existe.`);
    }
    return this.aSesion(usuario);
  }

  async crear(dto: CrearUsuarioDto): Promise<UsuarioSesion> {
    await this.validarRol(dto.rol);
    const existente = await this.prisma.usuario.findUnique({ where: { correo: dto.correo } });
    if (existente) {
      throw new ConflictException(`Ya existe un usuario con el correo "${dto.correo}".`);
    }
    const usuario = await this.prisma.usuario.create({
      data: { nombre: dto.nombre, correo: dto.correo, rolClave: dto.rol },
    });
    return this.aSesion(usuario);
  }

  async actualizar(id: string, dto: ActualizarUsuarioDto): Promise<UsuarioSesion> {
    await this.obtener(id);
    if (dto.rol) {
      await this.validarRol(dto.rol);
    }
    const usuario = await this.prisma.usuario.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        correo: dto.correo,
        rolClave: dto.rol,
        estado: dto.estado,
      },
    });
    await this.privilegios.invalidarUsuario(id);
    return this.aSesion(usuario);
  }

  /** Concede o revoca un privilegio específico a un usuario (RF-03). */
  async ajustarPrivilegio(id: string, dto: AjustarPrivilegioUsuarioDto) {
    await this.obtener(id);
    const privilegio = await this.prisma.privilegio.findUnique({
      where: { clave: dto.privilegio },
    });
    if (!privilegio) {
      throw new NotFoundException(`El privilegio "${dto.privilegio}" no existe en el catálogo.`);
    }
    const ajuste = await this.prisma.usuarioPrivilegio.upsert({
      where: {
        usuarioId_privilegioClave: { usuarioId: id, privilegioClave: dto.privilegio },
      },
      update: { concedido: dto.concedido },
      create: { usuarioId: id, privilegioClave: dto.privilegio, concedido: dto.concedido },
    });
    await this.privilegios.invalidarUsuario(id);
    return ajuste;
  }

  /** Elimina un ajuste por usuario; vuelve a aplicar lo que dicte su rol. */
  async quitarAjuste(id: string, privilegioClave: string) {
    await this.obtener(id);
    await this.prisma.usuarioPrivilegio.deleteMany({
      where: { usuarioId: id, privilegioClave },
    });
    await this.privilegios.invalidarUsuario(id);
    return { usuarioId: id, privilegio: privilegioClave, ajusteEliminado: true };
  }

  private async validarRol(clave: string) {
    const rol = await this.prisma.rol.findUnique({ where: { clave } });
    if (!rol) {
      throw new NotFoundException(`El rol "${clave}" no existe.`);
    }
  }

  private aSesion(usuario: {
    id: string;
    nombre: string;
    correo: string;
    rolClave: string;
    estado: string;
  }): UsuarioSesion {
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rolClave as UsuarioSesion["rol"],
      estado: usuario.estado as UsuarioSesion["estado"],
    };
  }
}
