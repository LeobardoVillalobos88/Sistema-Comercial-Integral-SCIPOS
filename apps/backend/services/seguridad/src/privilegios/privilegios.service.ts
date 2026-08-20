import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { PrivilegiosDeUsuario, ResultadoVerificacion } from "@scipos/backend-commons";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import type { CrearPrivilegioDto } from "./dto/crear-privilegio.dto";

interface PerfilPrivilegios {
  rol: string;
  estado: "ACTIVO" | "INACTIVO";
  accesoTotal: boolean;
  privilegios: string[];
  revocados: string[];
}

const FORMATO_PRIVILEGIO = /^[a-z]+:[a-z]+$/;
const TTL_CACHE_SEGUNDOS = 60;

const clavePerfil = (usuarioId: string) => `seguridad:privilegios:${usuarioId}`;

@Injectable()
export class PrivilegiosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  listarCatalogo() {
    return this.prisma.privilegio.findMany({ orderBy: { clave: "asc" } });
  }

  async registrar(dto: CrearPrivilegioDto) {
    if (!FORMATO_PRIVILEGIO.test(dto.clave)) {
      throw new BadRequestException(
        'La clave del privilegio debe tener el formato "modulo:accion" en minúsculas.',
      );
    }
    return this.prisma.privilegio.upsert({
      where: { clave: dto.clave },
      update: { descripcion: dto.descripcion },
      create: { clave: dto.clave, descripcion: dto.descripcion },
    });
  }

  async verificar(usuarioId: string, privilegio: string): Promise<ResultadoVerificacion> {
    const perfil = await this.obtenerPerfil(usuarioId);
    if (!perfil) {
      return { tiene: false, motivo: "USUARIO_NO_ENCONTRADO" };
    }
    if (perfil.estado !== "ACTIVO") {
      return { tiene: false, motivo: "USUARIO_INACTIVO" };
    }
    if (perfil.revocados.includes(privilegio)) {
      return { tiene: false, motivo: "SIN_PRIVILEGIO" };
    }
    if (perfil.accesoTotal || perfil.privilegios.includes(privilegio)) {
      return { tiene: true };
    }
    return { tiene: false, motivo: "SIN_PRIVILEGIO" };
  }

  async privilegiosDeUsuario(usuarioId: string): Promise<PrivilegiosDeUsuario> {
    const perfil = await this.obtenerPerfil(usuarioId);
    if (!perfil) {
      throw new NotFoundException(`El usuario "${usuarioId}" no existe.`);
    }
    let privilegios = perfil.privilegios;
    if (perfil.accesoTotal) {
      const catalogo = await this.prisma.privilegio.findMany({ select: { clave: true } });
      privilegios = catalogo
        .map((p) => p.clave)
        .filter((clave) => !perfil.revocados.includes(clave))
        .sort();
    }
    return { usuarioId, rol: perfil.rol, privilegios };
  }

  invalidarUsuario(usuarioId: string): Promise<void> {
    return this.redis.del(clavePerfil(usuarioId));
  }

  async invalidarRol(rolClave: string): Promise<void> {
    const usuarios = await this.prisma.usuario.findMany({
      where: { rolClave },
      select: { id: true },
    });
    await this.redis.del(...usuarios.map((u) => clavePerfil(u.id)));
  }

  private async obtenerPerfil(usuarioId: string): Promise<PerfilPrivilegios | null> {
    const cacheado = await this.redis.get<PerfilPrivilegios>(clavePerfil(usuarioId));
    if (cacheado) {
      return cacheado;
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        rol: { include: { privilegios: true } },
        privilegios: true,
      },
    });
    if (!usuario) {
      return null;
    }

    const delRol = usuario.rol.privilegios.map((p) => p.privilegioClave);
    const concedidos = usuario.privilegios.filter((p) => p.concedido).map((p) => p.privilegioClave);
    const revocados = usuario.privilegios.filter((p) => !p.concedido).map((p) => p.privilegioClave);
    const efectivos = [...new Set([...delRol, ...concedidos])]
      .filter((clave) => !revocados.includes(clave))
      .sort();

    const perfil: PerfilPrivilegios = {
      rol: usuario.rolClave,
      estado: usuario.estado,
      accesoTotal: usuario.rol.accesoTotal,
      privilegios: efectivos,
      revocados,
    };
    await this.redis.set(clavePerfil(usuarioId), perfil, TTL_CACHE_SEGUNDOS);
    return perfil;
  }
}
