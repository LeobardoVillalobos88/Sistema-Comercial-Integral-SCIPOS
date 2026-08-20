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
  proveedorPrivilegios?: Type<ProveedorPrivilegios>;
  extractorIdentidad?: Type<ExtractorIdentidad>;
  verificadorDenylist?: Type<VerificadorDenylist>;
}

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
