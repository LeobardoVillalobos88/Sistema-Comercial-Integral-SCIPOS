import { SetMetadata } from "@nestjs/common";

/** Clave de metadatos con el privilegio que exige un endpoint. */
export const CLAVE_PRIVILEGIO_REQUERIDO = "scipos:privilegioRequerido";

/** Clave de metadatos que marca un endpoint como "requiere identidad". */
export const CLAVE_REQUIERE_IDENTIDAD = "scipos:requiereIdentidad";

/**
 * Protege un endpoint con un privilegio `modulo:accion`. El guard responde
 * 401 si la petición no trae identidad y 403 si el usuario no cuenta con el
 * privilegio.
 *
 * Ejemplo:
 *   @Post()
 *   @RequierePrivilegio("productos:crear")
 *   crear(@Body() dto: CrearProductoDto) { ... }
 */
export const RequierePrivilegio = (privilegio: string) =>
  SetMetadata(CLAVE_PRIVILEGIO_REQUERIDO, privilegio);

/**
 * Exige que la petición traiga identidad (401 si falta) sin pedir un
 * privilegio específico. Útil para lecturas disponibles a cualquier usuario.
 */
export const RequiereIdentidad = () => SetMetadata(CLAVE_REQUIERE_IDENTIDAD, true);
