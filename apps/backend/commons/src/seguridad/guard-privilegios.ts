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
import { VERIFICADOR_DENYLIST, type VerificadorDenylist } from "./denylist";
import {
  EXTRACTOR_IDENTIDAD,
  type ExtractorIdentidad,
  type PeticionConCabeceras,
} from "./extractor-identidad";
import {
  CLAVE_PRIVILEGIO_REQUERIDO,
  CLAVE_REQUIERE_IDENTIDAD,
} from "./requiere-privilegio.decorator";

export interface PeticionConUsuario extends PeticionConCabeceras {
  usuarioId?: string;
}

@Injectable()
export class GuardPrivilegios implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(EXTRACTOR_IDENTIDAD) private readonly extractor: ExtractorIdentidad,
    @Inject(PROVEEDOR_PRIVILEGIOS) private readonly proveedor: ProveedorPrivilegios,
    @Inject(VERIFICADOR_DENYLIST) private readonly denylist: VerificadorDenylist,
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
    const identidad = await this.extractor.extraer(peticion);
    if (!identidad) {
      throw new UnauthorizedException("La petición no identifica al usuario.");
    }
    if (identidad.jti && (await this.denylist.estaRevocado(identidad.jti))) {
      throw new UnauthorizedException("La sesión fue cerrada (token revocado).");
    }
    peticion.usuarioId = identidad.usuarioId;

    if (!privilegio) {
      return true;
    }

    const resultado = await this.proveedor.verificar(identidad.usuarioId, privilegio);
    if (resultado.tiene) {
      return true;
    }
    if (resultado.motivo === "SIN_PRIVILEGIO") {
      throw new ForbiddenException(`No cuentas con el privilegio "${privilegio}".`);
    }
    throw new UnauthorizedException("El usuario indicado no existe o está inactivo.");
  }
}
