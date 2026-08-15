import { Module } from "@nestjs/common";
import { ClienteHttp } from "@scipos/backend-commons";

import { ClientesClient } from "./clientes.client";
import { ProductosClient } from "./productos.client";
import { VentasClient } from "./ventas.client";

@Module({
  providers: [ClienteHttp, ClientesClient, ProductosClient, VentasClient],
  exports: [ClientesClient, ProductosClient, VentasClient],
})
export class IntegracionesModule {}
