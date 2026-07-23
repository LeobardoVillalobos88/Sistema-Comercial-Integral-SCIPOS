import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { UsuarioSesion } from "@scipos/backend-commons";
import { compare } from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { PrismaService } from "../prisma/prisma.service";
import { PrivilegiosService } from "../privilegios/privilegios.service";
import type { IniciarSesionDto } from "./dto/iniciar-sesion.dto";

/** Respuesta del inicio de sesión: token firmado, usuario y sus privilegios. */
export interface SesionIniciada {
  token: string;
  usuario: UsuarioSesion;
  privilegios: string[];
}

@Injectable()
export class AuthService {
  private readonly secreto: string;
  private readonly expiraEn: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly privilegios: PrivilegiosService,
    config: ConfigService,
  ) {
    this.secreto = config.get<string>("JWT_SECRETO") ?? "scipos-secreto-dev";
    this.expiraEn = config.get<string>("JWT_EXPIRA") ?? "8h";
  }

  /** Valida credenciales y entrega un JWT con la identidad del usuario (RF-01). */
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

    const token = jwt.sign(
      { sub: usuario.id, correo: usuario.correo, rol: usuario.rolClave },
      this.secreto,
      { expiresIn: this.expiraEn as jwt.SignOptions["expiresIn"] },
    );
    const { privilegios } = await this.privilegios.privilegiosDeUsuario(usuario.id);
    return { token, usuario: this.aSesion(usuario), privilegios };
  }

  /** Usuario y privilegios del token vigente (para restaurar la sesión al recargar). */
  async perfil(usuarioId: string): Promise<Omit<SesionIniciada, "token">> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario || usuario.estado !== "ACTIVO") {
      throw new UnauthorizedException("El usuario del token no existe o está inactivo.");
    }
    const { privilegios } = await this.privilegios.privilegiosDeUsuario(usuario.id);
    return { usuario: this.aSesion(usuario), privilegios };
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
