# 🐺 SCIPOS — Guía del sistema (LOBOSOFT)

Guía rápida: **qué hace cada módulo** y **qué puede hacer cada rol**.
Para probar todo: `pnpm dev` y abre el shell en **http://localhost:3001**. Inicia sesión
en `/login` con una de las cuentas semilla (una por rol; ver el `README` raíz) para
recorrer el sistema desde ese rol.

---

## 1. ¿Qué es y cuál es el flujo?

SCIPOS gestiona el **ciclo comercial** de un negocio:

```
 Productos + Clientes  ──►  Cotización  ──►  Venta (POS)  ──►  Caja (corte)
   (qué / a quién)         (presupuesto)     (cobro)          (cierre del turno)
        ▲
        └── Punto de compra (reabastece el inventario a precio de compra)
```

1. **Inicio** → landing con el panorama del negocio: inventario valuado a precio de
   compra y de venta, ganancia potencial y gráficas comparativas por producto.
2. **Productos** → das de alta lo que vendes (lote, caducidad, precio de compra y de venta).
3. **Clientes** → das de alta a quién le vendes.
4. **Cotización** → armas un presupuesto para un cliente.
5. **Venta** → cobras: convirtiendo una cotización, o vendiendo directo en el **Punto de venta**.
6. **Compra** → registras reabastecimiento en el **Punto de compra** (suma inventario).
7. **Caja** → el cajero abre la caja, registra movimientos y hace el **corte** al cerrar.
8. **Dashboard** → el resumen operativo, y cambia según tu rol.

---

## 2. Los 4 roles (en resumen)

| Rol | Para qué sirve |
|-----|----------------|
| **Administrador** | Puede todo, incluidas las acciones destructivas (eliminar). |
| **Vendedor** | Atiende clientes: gestiona clientes, hace cotizaciones y vende en POS. |
| **Cajero** | Opera el dinero: vende en POS y maneja la caja (abrir, movimientos, cerrar). |
| **Supervisor** | Autoriza lo sensible: descuentos, cancelaciones, compras, cierre de caja y reportes. |

> **Importante:** el sistema NO se basa solo en el rol, sino en **privilegios** por
> acción (`modulo:accion`). El rol es solo un conjunto de privilegios. Por eso los
> botones y módulos **aparecen o desaparecen** según lo que tu rol tenga permitido.

---

## 3. ¿Qué módulos ve cada rol en el menú?

| Módulo | Admin | Vendedor | Cajero | Supervisor |
|--------|:-----:|:--------:|:------:|:----------:|
| Inicio | ✅ | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Productos | ✅ | ✅ | ✅ | ✅ |
| Clientes | ✅ | ✅ | ✅ | ✅ |
| Cotizaciones | ✅ | ✅ | ❌ | ✅ |
| Punto de venta | ✅ | ✅ | ✅ | ✅ |
| Punto de compra | ✅ | ❌ | ❌ | ✅ |
| Caja | ✅ | ❌ | ✅ | ✅ |

> El **Cajero** no ve Cotizaciones ni Punto de compra, y el **Vendedor** no ve Caja ni
> Punto de compra: no es parte de su trabajo.

---

## 4. Qué se hace en cada vista (y quién puede)

En las tablas, los botones de acción siguen siempre el mismo orden:
**Ver (ojo) → Activar/Desactivar (interruptor) → Editar (lápiz azul) → Eliminar (rojo)**.
Eliminar siempre pide confirmación.

### 🏠 Inicio
- **Todos** lo ven: resumen del negocio y gráficas de precios compra vs. venta.

### 📊 Dashboard
- **Todos** lo ven. Las tarjetas de resumen cambian según el rol; por ejemplo, la
  tarjeta de **Utilidad** solo la ven Administrador y Supervisor.

### 📦 Productos
| Acción | Quién puede |
|--------|-------------|
| Ver, buscar y filtrar el catálogo | Todos |
| Crear / editar / activar-desactivar producto | **Administrador, Supervisor** |
| Eliminar producto | **Administrador** |

*(El Vendedor y el Cajero solo consultan el catálogo.)*

**Aviso de inventario al entrar.** Cada vez que inicias sesión, si hay algo que
atender, el sistema abre un aviso con dos secciones: los lotes **vencidos o por
vencer** (con nombre, lote y fecha) y los productos **agotados o por agotarse**
(con lo que queda). Lo ven los cuatro roles, porque todos consultan el catálogo.
Aparece una sola vez por sesión: si recargas la página no vuelve a interrumpirte,
pero si cierras sesión y entras otra vez, lo recibes de nuevo.

Por omisión avisa cuando quedan **5 unidades o menos** y cuando faltan **2 semanas
o menos** para la caducidad. Esos dos números se configuran en el servicio de
productos y son los mismos que usan las cifras del dashboard.

### 👥 Clientes
| Acción | Quién puede |
|--------|-------------|
| Ver lista y detalle con historial | Todos los que ven el módulo |
| Crear / editar / activar-desactivar cliente | **Administrador, Vendedor** |
| Eliminar cliente | **Administrador** |

### 🧾 Cotizaciones
| Acción | Quién puede |
|--------|-------------|
| Ver historial y detalle | Administrador, Vendedor, Supervisor |
| Crear cotización | **Administrador, Vendedor** |
| Marcar como enviada | **Administrador, Vendedor** |
| Convertir a venta | **Administrador, Vendedor** |
| Eliminar cotización | **Administrador** |

**Ciclo de una cotización:** `Borrador → Enviada → Vendida`
- **Borrador:** recién creada, en preparación.
- **Enviada:** ya se le presentó al cliente (botón *Marcar como enviada*).
- **Vendida:** el cliente aceptó y se convirtió en venta (botón *Convertir a venta*).

### 🛒 Punto de venta (POS)
| Acción | Quién puede |
|--------|-------------|
| Armar carrito y cobrar (precio de venta, resta inventario) | Administrador, Vendedor, Cajero |
| Aplicar descuento | **Administrador, Supervisor** |
| Cancelar venta | **Administrador, Supervisor** |

### 🛍️ Punto de compra
| Acción | Quién puede |
|--------|-------------|
| Registrar compras a proveedor (precio de compra, suma inventario) | **Administrador, Supervisor** |

### 💰 Caja
| Acción | Quién puede |
|--------|-------------|
| Ver caja, ventas y cortes | Administrador, Cajero, Supervisor |
| Abrir caja y registrar movimientos | **Administrador, Cajero** |
| Cierre con corte | **Administrador, Cajero, Supervisor** |

---

## 5. Notas de uso

- Los datos viven en un **backend real** (microservicios NestJS + PostgreSQL) al que
  cada módulo llama a través del gateway; el backend **valida cada acción** según los
  privilegios del usuario, no solo oculta botones.
- Al realizar acciones el sistema responde con **notificaciones** (arriba a la
  derecha): verde = éxito, azul = información, rojo = error; y pide **confirmación**
  antes de acciones destructivas.
- Donde hay que elegir de una lista que puede crecer (clientes, productos), el
  campo **se puede escribir además de desplegar**: teclea parte del nombre y la
  lista se filtra sola. Se reconoce por la lupa en lugar de la flecha.
- Si algo sale mal el sistema **explica qué pasó y ofrece por dónde salir**, en
  lugar de dejar una pantalla en blanco: sesión terminada, pantalla sin acceso,
  dirección que no existe, falla interna o servidor sin responder.
- El **menú lateral** se abre y se cierra con la flecha de su orilla. Cerrado
  deja solo los iconos y el monograma SC; al abrirse se desliza y aparecen los
  nombres de los módulos.

---

## 6. Para desarrollar

- Todo lo compartido (componentes, tema, permisos, feedback, datos) vive en
  `@scipos/frontend-commons`.
- Cada acción sensible se protege con `usePermisos()` / `<Permiso requiere="modulo:accion">`
  en el frontend **y** con `@RequierePrivilegio("modulo:accion")` en el endpoint que
  ejecuta esa acción. Ocultar el botón no basta: si el endpoint queda sin guard, la
  acción sigue siendo alcanzable con una petición directa.
- Un permiso nuevo se registra en **dos** lugares: el catálogo del servicio de
  seguridad (su semilla, o `POST /privilegios`), que es la fuente de verdad, y
  `apps/frontend/commons/src/permisos/matriz.ts`, que solo es el respaldo que usa la
  interfaz cuando la API no responde.
- Más detalle técnico en `CLAUDE.md` y `apps/frontend/README.md`.

## 7. Para publicar el sistema

El despliegue se hace con contenedores sobre una sola máquina, detrás de nginx.
El procedimiento completo —desde crear la instancia hasta verificar que responde—
está en [`docs/DESPLIEGUE-AWS.md`](../DESPLIEGUE-AWS.md).
