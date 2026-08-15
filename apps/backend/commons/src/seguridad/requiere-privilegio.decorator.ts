import { SetMetadata } from "@nestjs/common";

export const CLAVE_PRIVILEGIO_REQUERIDO = "scipos:privilegioRequerido";

export const CLAVE_REQUIERE_IDENTIDAD = "scipos:requiereIdentidad";

export const RequierePrivilegio = (privilegio: string) =>
  SetMetadata(CLAVE_PRIVILEGIO_REQUERIDO, privilegio);

export const RequiereIdentidad = () => SetMetadata(CLAVE_REQUIERE_IDENTIDAD, true);
