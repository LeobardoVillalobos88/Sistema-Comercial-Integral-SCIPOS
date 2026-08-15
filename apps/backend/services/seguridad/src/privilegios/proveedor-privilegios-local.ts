import { Injectable } from "@nestjs/common";
import type { ProveedorPrivilegios, ResultadoVerificacion } from "@scipos/backend-commons";
import { PrivilegiosService } from "./privilegios.service";

@Injectable()
export class ProveedorPrivilegiosLocal implements ProveedorPrivilegios {
  constructor(private readonly privilegios: PrivilegiosService) {}

  verificar(usuarioId: string, privilegio: string): Promise<ResultadoVerificacion> {
    return this.privilegios.verificar(usuarioId, privilegio);
  }
}
