import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PROVEEDOR_PRIVILEGIOS, type ProveedorPrivilegios } from "../contratos/privilegios";
import {
  EXTRACTOR_IDENTIDAD,
  type ExtractorIdentidad,
  type PeticionConCabeceras,
} from "./extractor-identidad";
import {
  CLAVE_PRIVILEGIO_REQUERIDO,
  CLAVE_REQUIERE_IDENTIDAD,
} from "./requiere-privilegio.decorator";

/** Petición enriquecida con la identidad ya resuelta por el guard. */
export interface PeticionConUsuario extends PeticionConCabeceras {
  usuarioId?: string;
}

/**
 * Guard global que valida los privilegios dinámicos en el backend (RF-05,
 * RF-06). Los endpoints declaran lo que exigen con @RequierePrivilegio o
 * @RequiereIdentidad; los que no declaran nada son públicos.
 */
@Injectable()
export class GuardPrivilegios implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(EXTRACTOR_IDENTIDAD) private readonly extractor: ExtractorIdentidad,
    @Inject(PROVEEDOR_PRIVILEGIOS) private readonly proveedor: ProveedorPrivilegios,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const objetivos = [contexto.getHandler(), contexto.getClass()];
    const privilegio = this.reflector.getAllAndOverride<string | undefined>(
      CLAVE_PRIVILEGIO_REQUERIDO,
      objetivos,
    );
    const requiereIdentidad = this.reflector.getAllAndOverride<boolean | undefined>(
      CLAVE_REQUIERE_IDENTIDAD,
      objetivos,
    );

    if (!privilegio && !requiereIdentidad) {
      return true;
    }

    const peticion = contexto.switchToHttp().getRequest<PeticionConUsuario>();
    const usuarioId = this.extractor.extraer(peticion);
    if (!usuarioId) {
      throw new UnauthorizedException(
        "La petición no identifica al usuario (falta el header x-usuario-id).",
      );
    }
    peticion.usuarioId = usuarioId;

    if (!privilegio) {
      return true;
    }

    const resultado = await this.proveedor.verificar(usuarioId, privilegio);
    if (resultado.tiene) {
      return true;
    }
    if (resultado.motivo === "SIN_PRIVILEGIO") {
      throw new ForbiddenException(`No cuentas con el privilegio "${privilegio}".`);
    }
    throw new UnauthorizedException("El usuario indicado no existe o está inactivo.");
  }
}
