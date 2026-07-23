import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClienteHttp } from "@scipos/backend-commons";
import PDFDocument from "pdfkit";
import { PrismaService } from "../prisma/prisma.service";
import { redondearMoneda } from "../utils/calculos-venta";

/** Formatea un monto como moneda mexicana para el comprobante. */
function moneda(valor: number): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(valor);
}

/**
 * Genera el comprobante PDF no fiscal de una venta (RF-27, RF-28, RF-29):
 * folio, fecha, cliente, partidas con importes y totales. La facturación es
 * simulada, por lo que el documento lo declara explícitamente.
 */
@Injectable()
export class ComprobantesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly http: ClienteHttp,
    private readonly config: ConfigService,
  ) {}

  async generar(ventaId: string, usuarioId: string): Promise<Buffer> {
    const venta = await this.prisma.venta.findUnique({
      where: { id: ventaId },
      include: { partidas: true },
    });
    if (!venta) {
      throw new NotFoundException(`La venta con ID "${ventaId}" no existe.`);
    }

    const clienteNombre = await this.nombreCliente(venta.clienteId, usuarioId);
    const nombresProductos = await this.nombresProductos(
      venta.partidas.map((partida) => partida.productoId),
      usuarioId,
    );
    const subtotal = redondearMoneda(
      venta.partidas.reduce((acumulado, partida) => acumulado + partida.subtotal, 0),
    );

    return new Promise<Buffer>((resolver, rechazar) => {
      const doc = new PDFDocument({ size: "LETTER", margin: 50 });
      const partes: Buffer[] = [];
      doc.on("data", (parte: Buffer) => partes.push(parte));
      doc.on("end", () => resolver(Buffer.concat(partes)));
      doc.on("error", rechazar);

      // Encabezado
      doc.fontSize(20).font("Helvetica-Bold").text("SCIPOS · Sistema Comercial Integral");
      doc.moveDown(0.3);
      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor("#555555")
        .text("COMPROBANTE DE VENTA NO FISCAL (facturación simulada, sin validez tributaria)");
      doc.moveDown(1);

      // Datos generales
      doc.fillColor("#000000").fontSize(11);
      doc.font("Helvetica-Bold").text("Folio: ", { continued: true });
      doc.font("Helvetica").text(venta.id);
      doc.font("Helvetica-Bold").text("Fecha: ", { continued: true });
      doc
        .font("Helvetica")
        .text(
          new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeStyle: "short" }).format(
            venta.fecha,
          ),
        );
      doc.font("Helvetica-Bold").text("Cliente: ", { continued: true });
      doc.font("Helvetica").text(clienteNombre);
      if (venta.cotizacionId) {
        doc.font("Helvetica-Bold").text("Origen: ", { continued: true });
        doc.font("Helvetica").text(`Cotización ${venta.cotizacionId}`);
      }
      doc.font("Helvetica-Bold").text("Estado: ", { continued: true });
      doc.font("Helvetica").text(venta.estado === "CANCELADA" ? "CANCELADA" : "COMPLETA");
      doc.moveDown(1);

      // Tabla de partidas
      const xProducto = 50;
      const xCantidad = 320;
      const xPrecio = 390;
      const xImporte = 480;
      doc.font("Helvetica-Bold").fontSize(10);
      const yEncabezado = doc.y;
      doc.text("Producto", xProducto, yEncabezado);
      doc.text("Cant.", xCantidad, yEncabezado, { width: 50, align: "right" });
      doc.text("Precio", xPrecio, yEncabezado, { width: 70, align: "right" });
      doc.text("Importe", xImporte, yEncabezado, { width: 70, align: "right" });
      doc
        .moveTo(xProducto, doc.y + 3)
        .lineTo(550, doc.y + 3)
        .strokeColor("#999999")
        .stroke();
      doc.moveDown(0.5);

      doc.font("Helvetica").fontSize(10);
      for (const partida of venta.partidas) {
        const y = doc.y;
        const nombre = nombresProductos.get(partida.productoId) ?? partida.productoId;
        doc.text(nombre, xProducto, y, { width: 260 });
        doc.text(String(partida.cantidad), xCantidad, y, { width: 50, align: "right" });
        doc.text(moneda(partida.precioVenta), xPrecio, y, { width: 70, align: "right" });
        doc.text(moneda(partida.subtotal), xImporte, y, { width: 70, align: "right" });
        doc.moveDown(0.4);
      }

      doc
        .moveTo(xProducto, doc.y + 3)
        .lineTo(550, doc.y + 3)
        .strokeColor("#999999")
        .stroke();
      doc.moveDown(0.6);

      // Totales
      const totales: Array<[string, string]> = [
        ["Subtotal", moneda(subtotal)],
        ["Descuento", moneda(venta.descuento)],
        ["IVA (16%)", moneda(venta.iva)],
        ["Total", moneda(venta.total)],
      ];
      for (const [etiqueta, valor] of totales) {
        const y = doc.y;
        const esTotal = etiqueta === "Total";
        doc.font(esTotal ? "Helvetica-Bold" : "Helvetica").fontSize(esTotal ? 12 : 10);
        doc.text(etiqueta, xPrecio - 60, y, { width: 120, align: "right" });
        doc.text(valor, xImporte, y, { width: 70, align: "right" });
        doc.moveDown(0.3);
      }

      doc.moveDown(1.5);
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#777777")
        .text(
          "Este documento es un comprobante interno de SCIPOS. No es un CFDI ni tiene efectos fiscales.",
          50,
          doc.y,
          { width: 500, align: "center" },
        );

      doc.end();
    });
  }

  private async nombreCliente(clienteId: string, usuarioId: string): Promise<string> {
    const base = this.config.get<string>("CLIENTES_URL") ?? "http://localhost:4003";
    try {
      const cliente = await this.http.get<{ nombre: string }>(`${base}/${clienteId}`, {
        usuarioId,
      });
      return cliente.nombre;
    } catch {
      return clienteId;
    }
  }

  private async nombresProductos(
    productoIds: string[],
    usuarioId: string,
  ): Promise<Map<string, string>> {
    const base = this.config.get<string>("PRODUCTOS_URL") ?? "http://localhost:4002";
    const idsUnicos = [...new Set(productoIds)];
    const pares = await Promise.all(
      idsUnicos.map(async (id) => {
        try {
          const producto = await this.http.get<{ nombre: string }>(`${base}/productos/${id}`, {
            usuarioId,
          });
          return [id, producto.nombre] as const;
        } catch {
          return [id, id] as const;
        }
      }),
    );
    return new Map(pares);
  }
}
