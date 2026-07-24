import { type DynamicModule, Module, type Type } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { PROVEEDOR_PRIVILEGIOS, type ProveedorPrivilegios } from "../contratos/privilegios";
import { DenylistRedis, VERIFICADOR_DENYLIST, type VerificadorDenylist } from "./denylist";
import { EXTRACTOR_IDENTIDAD, type ExtractorIdentidad } from "./extractor-identidad";
import { ExtractorIdentidadJwt } from "./extractor-identidad-jwt";
import { GuardPrivilegios } from "./guard-privilegios";
import { ProveedorPrivilegiosHttp } from "./proveedor-privilegios-http";
import { VerificadorToken } from "./verificador-token";

export interface OpcionesModuloSeguridad {
  /**
   * Implementación del proveedor de privilegios. Por defecto se consulta al
   * servicio de seguridad por REST; el propio servicio de seguridad registra
   * aquí su implementación local para no llamarse a sí mismo.
   */
  proveedorPrivilegios?: Type<ProveedorPrivilegios>;
  /**
   * Estrategia de identidad. Por defecto se usa ExtractorIdentidadJwt: token
   * Bearer RS256 (verificado contra el JWKS del servicio de seguridad) para
   * peticiones externas y header x-usuario-id para las llamadas entre servicios.
   */
  extractorIdentidad?: Type<ExtractorIdentidad>;
  /**
   * Verificador de la denylist de tokens revocados por logout. Por defecto se
   * consulta Redis; el servicio de seguridad, que además revoca, comparte esa
   * misma lista.
   */
  verificadorDenylist?: Type<VerificadorDenylist>;
}

/**
 * Módulo común de seguridad. Registra el guard de privilegios de forma
 * global: todo controlador del servicio queda protegido según sus
 * decoradores @RequierePrivilegio / @RequiereIdentidad.
 *
 * Uso en el AppModule de cada servicio:
 *   imports: [ModuloSeguridad.registrar()]
 */
@Module({})
// biome-ignore lint/complexity/noStaticOnlyClass: patrón de módulo dinámico de NestJS (registrar estático)
export class ModuloSeguridad {
  static registrar(opciones: OpcionesModuloSeguridad = {}): DynamicModule {
    return {
      module: ModuloSeguridad,
      global: true,
      providers: [
        VerificadorToken,
        {
          provide: EXTRACTOR_IDENTIDAD,
          useClass: opciones.extractorIdentidad ?? ExtractorIdentidadJwt,
        },
        {
          provide: PROVEEDOR_PRIVILEGIOS,
          useClass: opciones.proveedorPrivilegios ?? ProveedorPrivilegiosHttp,
        },
        {
          provide: VERIFICADOR_DENYLIST,
          useClass: opciones.verificadorDenylist ?? DenylistRedis,
        },
        { provide: APP_GUARD, useClass: GuardPrivilegios },
      ],
      exports: [EXTRACTOR_IDENTIDAD, PROVEEDOR_PRIVILEGIOS, VERIFICADOR_DENYLIST, VerificadorToken],
    };
  }
}
