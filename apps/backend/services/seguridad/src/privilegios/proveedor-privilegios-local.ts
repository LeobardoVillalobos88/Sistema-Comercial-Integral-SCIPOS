import { Injectable } from "@nestjs/common";
import type { ProveedorPrivilegios, ResultadoVerificacion } from "@scipos/backend-commons";
import { PrivilegiosService } from "./privilegios.service";

/**
 * Proveedor de privilegios que consulta directamente la base de datos de
 * este servicio. Es la implementación que usa el guard aquí, ya que el
 * servicio de seguridad es la fuente de verdad y no debe llamarse a sí
 * mismo por HTTP.
 */
@Injectable()
export class ProveedorPrivilegiosLocal implements ProveedorPrivilegios {
  constructor(private readonly privilegios: PrivilegiosService) {}

  verificar(usuarioId: string, privilegio: string): Promise<ResultadoVerificacion> {
    return this.privilegios.verificar(usuarioId, privilegio);
  }
}
