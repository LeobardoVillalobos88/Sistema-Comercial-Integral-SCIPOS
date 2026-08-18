import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PREFIJO_DENYLIST, type UsuarioSesion } from "@scipos/backend-commons";
import { compare } from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { PrivilegiosService } from "../privilegios/privilegios.service";
import { RedisService } from "../redis/redis.service";
import type { IniciarSesionDto } from "./dto/iniciar-sesion.dto";
import { FirmadorToken } from "./firmador-token";

export interface SesionIniciada {
  token: string;
  refreshToken: string;
  tipoToken: "Bearer";
  expiraEn: Date;
  usuario: UsuarioSesion;
  privilegios: string[];
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function nuevoTokenOpaco(): string {
  return randomBytes(48).toString("base64url");
}

@Injectable()
export class AuthService {
  private readonly ttlRefreshSeg = Number(process.env.JWT_REFRESH_TTL_SECONDS ?? 604800);

  constructor(
    private readonly prisma: PrismaService,
    private readonly privilegios: PrivilegiosService,
    private readonly firmador: FirmadorToken,
    private readonly redis: RedisService,
  ) {}

  obtenerJwks() {
    return this.firmador.obtenerJwks();
  }

  async iniciarSesion(dto: IniciarSesionDto): Promise<SesionIniciada> {
    const usuario = await this.prisma.usuario.findUnique({ where: { correo: dto.correo } });
    const hashValido =
      usuario !== null &&
      usuario.contrasenaHash !== "" &&
      (await compare(dto.contrasena, usuario.contrasenaHash));
    if (!usuario || !hashValido) {
      throw new UnauthorizedException("Correo o contraseña incorrectos.");
    }
    if (usuario.estado !== "ACTIVO") {
      throw new UnauthorizedException("El usuario está inactivo.");
    }
    return this.emitirSesion(usuario.id);
  }

  async refrescar(refreshToken: string): Promise<SesionIniciada> {
    const tokenHash = hashToken(refreshToken);
    const nuevoRefresh = nuevoTokenOpaco();

    const rotado = await this.prisma.$transaction(async (tx) => {
      const guardado = await tx.refreshToken.findUnique({ where: { tokenHash } });
      if (!guardado) {
        throw new UnauthorizedException("Refresh inválido. Inicia sesión de nuevo.");
      }
      const consumido = await tx.refreshToken.updateMany({
        where: { id: guardado.id, usadoEn: null, revocadoEn: null, expiraEn: { gt: new Date() } },
        data: { usadoEn: new Date() },
      });
      if (consumido.count !== 1) {
        await tx.refreshToken.updateMany({
          where: { familyId: guardado.familyId },
          data: { revocadoEn: new Date() },
        });
        return { reusado: true as const };
      }
      await tx.refreshToken.create({
        data: {
          usuarioId: guardado.usuarioId,
          tokenHash: hashToken(nuevoRefresh),
          familyId: guardado.familyId,
          expiraEn: new Date(Date.now() + this.ttlRefreshSeg * 1000),
        },
      });
      return {
        reusado: false as const,
        usuarioId: guardado.usuarioId,
        familyId: guardado.familyId,
      };
    });

    if (rotado.reusado) {
      throw new UnauthorizedException(
        "El refresh token fue reusado: la sesión se cerró por seguridad. Inicia sesión de nuevo.",
      );
    }
    return this.emitirSesion(rotado.usuarioId, rotado.familyId, nuevoRefresh);
  }

  async cerrarSesion(usuarioId: string, jti: string | undefined, expSeg: number | undefined) {
    if (jti) {
      const ttl = expSeg
        ? Math.max(expSeg - Math.floor(Date.now() / 1000), 0)
        : this.firmador.ttlAcceso;
      await this.redis.marcar(`${PREFIJO_DENYLIST}${jti}`, ttl);
    }
    await this.prisma.refreshToken.updateMany({
      where: { usuarioId, revocadoEn: null },
      data: { revocadoEn: new Date() },
    });
    return { sesionCerrada: true };
  }

  async perfil(usuarioId: string): Promise<{ usuario: UsuarioSesion; privilegios: string[] }> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario || usuario.estado !== "ACTIVO") {
      throw new UnauthorizedException("El usuario del token no existe o está inactivo.");
    }
    const { privilegios } = await this.privilegios.privilegiosDeUsuario(usuario.id);
    return { usuario: this.aSesion(usuario), privilegios };
  }

  private async emitirSesion(
    usuarioId: string,
    familyId?: string,
    refreshRotado?: string,
  ): Promise<SesionIniciada> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario || usuario.estado !== "ACTIVO") {
      throw new UnauthorizedException("El usuario no está disponible.");
    }
    const { privilegios } = await this.privilegios.privilegiosDeUsuario(usuarioId);

    const { token, expiraEn } = await this.firmador.firmarAcceso({
      sub: usuario.id,
      correo: usuario.correo,
      rol: usuario.rolClave,
      privilegios,
      jti: randomUUID(),
    });

    const refreshToken = refreshRotado ?? nuevoTokenOpaco();
    if (!refreshRotado) {
      await this.prisma.refreshToken.create({
        data: {
          usuarioId,
          tokenHash: hashToken(refreshToken),
          familyId: familyId ?? randomUUID(),
          expiraEn: new Date(Date.now() + this.ttlRefreshSeg * 1000),
        },
      });
    }

    return {
      token,
      refreshToken,
      tipoToken: "Bearer",
      expiraEn,
      usuario: this.aSesion(usuario),
      privilegios,
    };
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
