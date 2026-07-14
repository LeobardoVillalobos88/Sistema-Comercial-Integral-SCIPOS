import { type DynamicModule, Module, type Type } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { PROVEEDOR_PRIVILEGIOS, type ProveedorPrivilegios } from "../contratos/privilegios";
import { EXTRACTOR_IDENTIDAD, ExtractorIdentidadHeader } from "./extractor-identidad";
import { GuardPrivilegios } from "./guard-privilegios";
import { ProveedorPrivilegiosHttp } from "./proveedor-privilegios-http";

export interface OpcionesModuloSeguridad {
  /**
   * Implementación del proveedor de privilegios. Por defecto se consulta al
   * servicio de seguridad por REST; el propio servicio de seguridad registra
   * aquí su implementación local para no llamarse a sí mismo.
   */
  proveedorPrivilegios?: Type<ProveedorPrivilegios>;
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
        { provide: EXTRACTOR_IDENTIDAD, useClass: ExtractorIdentidadHeader },
        {
          provide: PROVEEDOR_PRIVILEGIOS,
          useClass: opciones.proveedorPrivilegios ?? ProveedorPrivilegiosHttp,
        },
        { provide: APP_GUARD, useClass: GuardPrivilegios },
      ],
      exports: [EXTRACTOR_IDENTIDAD, PROVEEDOR_PRIVILEGIOS],
    };
  }
}
