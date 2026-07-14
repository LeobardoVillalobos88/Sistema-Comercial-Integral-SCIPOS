import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { RequiereIdentidad, RequierePrivilegio } from "@scipos/backend-commons";
import { ActualizarEjemploDto } from "./dto/actualizar-ejemplo.dto";
import { CrearEjemploDto } from "./dto/crear-ejemplo.dto";
import { EjemplosService } from "./ejemplos.service";

@ApiTags("ejemplos")
@Controller("ejemplos")
export class EjemplosController {
  constructor(private readonly ejemplos: EjemplosService) {}

  @Get()
  @RequiereIdentidad()
  @ApiOperation({ summary: "Listar ejemplos" })
  listar() {
    return this.ejemplos.listar();
  }

  @Get(":id")
  @RequiereIdentidad()
  @ApiOperation({ summary: "Obtener un ejemplo por id" })
  @ApiParam({ name: "id", example: "ejemplo-1" })
  obtener(@Param("id") id: string) {
    return this.ejemplos.obtener(id);
  }

  @Post()
  @RequierePrivilegio("ejemplo:crear")
  @ApiOperation({ summary: "Crear un ejemplo" })
  crear(@Body() dto: CrearEjemploDto) {
    return this.ejemplos.crear(dto);
  }

  @Patch(":id")
  @RequierePrivilegio("ejemplo:editar")
  @ApiOperation({ summary: "Actualizar un ejemplo" })
  @ApiParam({ name: "id", example: "ejemplo-1" })
  actualizar(@Param("id") id: string, @Body() dto: ActualizarEjemploDto) {
    return this.ejemplos.actualizar(id, dto);
  }

  @Delete(":id")
  @RequierePrivilegio("ejemplo:eliminar")
  @ApiOperation({ summary: "Eliminar un ejemplo" })
  @ApiParam({ name: "id", example: "ejemplo-1" })
  eliminar(@Param("id") id: string) {
    return this.ejemplos.eliminar(id);
  }
}
