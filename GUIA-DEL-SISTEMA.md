# 🐺 SCIPOS — Guía del sistema (LOBOSOFT)

Guía rápida para el equipo: **qué hace cada módulo** y **qué puede hacer cada rol**.
Para probar todo: `pnpm dev` y abre el shell en **http://localhost:3001**. El rol se
cambia con el **selector de la barra superior** (arriba a la derecha).

---

## 1. ¿Qué es y cuál es el flujo?

SCIPOS gestiona el **ciclo comercial** de un negocio:

```
 Productos + Clientes  ──►  Cotización  ──►  Venta (POS)  ──►  Caja (corte)
   (qué / a quién)         (presupuesto)     (cobro)          (cierre del turno)
```

1. **Productos** → das de alta lo que vendes.
2. **Clientes** → das de alta a quién le vendes.
3. **Cotización** → armas un presupuesto para un cliente.
4. **Venta** → cobras: convirtiendo una cotización, o vendiendo directo en el **POS**.
5. **Caja** → el cajero abre la caja, registra movimientos y hace el **corte** al cerrar.
6. **Dashboard** → el resumen de todo, y cambia según tu rol.

---

## 2. Los 4 roles (en resumen)

| Rol | Para qué sirve |
|-----|----------------|
| **Administrador** | Puede todo, sin restricción. |
| **Vendedor** | Atiende clientes: gestiona clientes, hace cotizaciones y vende en POS. |
| **Cajero** | Opera el dinero: vende en POS y maneja la caja (abrir, movimientos, cerrar). |
| **Supervisor** | Autoriza lo sensible: descuentos, cancelaciones, cierre de caja y ve reportes. |

> **Importante:** el sistema NO se basa solo en el rol, sino en **privilegios** por
> acción (`modulo:accion`). El rol es solo un conjunto de privilegios. Por eso los
> botones y módulos **aparecen o desaparecen** según lo que tu rol tenga permitido.

---

## 3. ¿Qué módulos ve cada rol en el menú?

| Módulo | Admin | Vendedor | Cajero | Supervisor |
|--------|:-----:|:--------:|:------:|:----------:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Productos | ✅ | ✅ | ✅ | ✅ |
| Clientes | ✅ | ✅ | ✅ | ✅ |
| Cotizaciones | ✅ | ✅ | ❌ | ✅ |
| Punto de venta | ✅ | ✅ | ✅ | ✅ |
| Caja | ✅ | ❌ | ✅ | ✅ |

> El **Cajero** no ve Cotizaciones y el **Vendedor** no ve Caja: no es parte de su trabajo.

---

## 4. Qué se hace en cada vista (y quién puede)

### 📊 Dashboard
- **Todos** lo ven. Las tarjetas de resumen cambian según el rol; por ejemplo, la
  tarjeta de **Utilidad** solo la ven Administrador y Supervisor.

### 📦 Productos
| Acción | Quién puede |
|--------|-------------|
| Ver, buscar y filtrar el catálogo | Todos |
| Crear / editar / activar-desactivar producto | **Administrador, Supervisor** |

*(El Vendedor y el Cajero solo consultan el catálogo.)*

### 👥 Clientes
| Acción | Quién puede |
|--------|-------------|
| Ver lista y detalle con historial | Todos los que ven el módulo |
| Crear / editar / activar-desactivar cliente | **Administrador, Vendedor** |

### 🧾 Cotizaciones
| Acción | Quién puede |
|--------|-------------|
| Ver historial y detalle | Administrador, Vendedor, Supervisor |
| Crear cotización | **Administrador, Vendedor** |
| Marcar como enviada | **Administrador, Vendedor** |
| Convertir a venta | **Administrador, Vendedor** |

**Ciclo de una cotización:** `Borrador → Enviada → Vendida`
- **Borrador:** recién creada, en preparación.
- **Enviada:** ya se le presentó al cliente (botón *Marcar como enviada*).
- **Vendida:** el cliente aceptó y se convirtió en venta (botón *Convertir a venta*).

### 🛒 Punto de venta (POS)
| Acción | Quién puede |
|--------|-------------|
| Armar carrito y cobrar | Administrador, Vendedor, Cajero |
| Aplicar descuento | **Administrador, Supervisor** |
| Cancelar venta | **Administrador, Supervisor** |

### 💰 Caja
| Acción | Quién puede |
|--------|-------------|
| Ver caja, ventas y cortes | Administrador, Cajero, Supervisor |
| Abrir caja y registrar movimientos | **Administrador, Cajero** |
| Cierre con corte | **Administrador, Cajero, Supervisor** |

---

## 5. Nota importante (es un prototipo)

Cada módulo funciona con **datos de ejemplo (mock)** y **no comparten estado en vivo
todavía**: por ejemplo, convertir una cotización no suma sola a la caja. Esa conexión
real entre módulos es trabajo del **backend** (siguiente avance). Por ahora el flujo se
demuestra **módulo por módulo**, y cada uno se ve completo y navegable.

---

## 6. Para desarrollar

- Todo lo compartido (componentes, tema, permisos, datos) vive en `@scipos/frontend-commons`.
- Cada acción sensible se protege con `usePermisos()` / `<Permiso requiere="modulo:accion">`.
- Si tu módulo necesita un permiso nuevo, agrégalo en
  `apps/frontend/commons/src/permisos/matriz.ts` a los roles que correspondan.
- Más detalle técnico en `CLAUDE.md` y `apps/frontend/README.md`.
