# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Cuatro roles operan el sistema, cada uno con un trabajo distinto y una relación
distinta con el dinero:

- **Administrador** — configura el sistema y administra usuarios y privilegios.
  Es el único que puede eliminar registros.
- **Vendedor** — atiende al cliente: da de alta clientes, arma cotizaciones y
  cobra en el punto de venta.
- **Cajero** — opera el efectivo: vende en el POS, abre la caja, registra
  ingresos y egresos, y hace el corte al cerrar el turno.
- **Supervisor** — autoriza lo sensible: descuentos, cancelaciones, compras,
  cierre de caja y reportes.

El rol no es la unidad real de control: es un conjunto de privilegios
`modulo:accion`. Un usuario puede recibir o perder privilegios de forma
individual sin cambiar de rol.

## Product Purpose

SCIPOS cubre el ciclo comercial completo de un negocio que vende productos:

```
Productos + Clientes ──► Cotización ──► Venta (POS) ──► Caja (corte)
                                              ▲
                              Punto de compra ┘ (reabastece inventario)
```

Éxito significa que un turno completo se pueda operar de principio a fin —
abrir caja, cotizar, vender, reabastecer y cerrar con corte cuadrado— y que
cada acción quede autorizada y registrada del lado del servidor.

## Positioning

La diferencia del sistema son los **privilegios dinámicos por módulo y acción,
validados en el backend**. No es control de acceso por rol: cada acción concreta
(`productos:eliminar`, `pos:descuento`, `caja:cerrar`) se concede o revoca de
forma independiente, incluso por usuario, y la interfaz refleja lo que la API
autoriza en lugar de decidirlo por su cuenta. Ocultar un botón nunca es
suficiente: el endpoint responde 401 o 403 aunque se fuerce la petición.

Esta es la pieza calificada por encima de todo lo demás. Ningún cambio puede
degradarla.

## Operating Context

- **Comercio genérico, sin sector definido.** El sistema debe servir a cualquier
  PyME que venda productos. Los datos semilla (abarrotes, refrescos, pan) son
  ejemplo, no el público objetivo: la interfaz no debe guiñar a un giro concreto.
- **El turno de caja es un ritual con estado.** Abrir caja habilita las ventas;
  el corte las cierra y produce un balance. Recargar la página no debe perder un
  turno abierto.
- **Se evalúa de dos maneras**, y ambas cuentan:
  1. **Defensa en vivo** ante el profesor, recorriendo módulos en pantalla
     proyectada o compartida. El sistema se juzga en los primeros segundos y a
     distancia.
  2. **Revisión por cuenta propia** contra una rúbrica: el evaluador levanta el
     sistema con las cuentas semilla y navega sin guía. Debe entenderse solo, y
     el sistema de privilegios debe ser evidente al cambiar de rol.
- **La demostración de privilegios es parte del uso.** Iniciar sesión con roles
  distintos y comparar qué aparece y qué desaparece es el recorrido que prueba
  el valor del sistema.

## Capabilities and Constraints

**Módulos en producción:** inicio (panorama del negocio), dashboard reactivo al
rol, productos, clientes, cotizaciones con ciclo Borrador → Enviada → Vendida,
punto de venta, punto de compra, caja con corte, comprobante PDF no fiscal,
reportes con exportación CSV, y administración de usuarios.

**Restricciones técnicas que el diseño no puede romper:**

- Stack obligatorio por el brief: Next.js + TypeScript + **MUI** en
  microfrontends separados. No se puede introducir Bootstrap ni otro framework
  visual: chocaría con el stack mandatado.
- Todo lo compartido vive en `@scipos/frontend-commons`. No se inventa UI
  compartida ad-hoc; se extiende commons.
- Idioma **español (es-MX)** en interfaz, documentación, comentarios e
  identificadores.
- El backend recalcula precios y totales; el frontend nunca decide cuánto se
  cobra.

**Sin decidir:** no existe un manual de identidad, ni tipografías o paletas
mandatadas más allá de lo que hoy vive en el tema de MUI.

## Brand Commitments

- **SCIPOS es el producto**; su nombre completo es *Sistema Comercial Integral*.
  La interfaz debe identificarse como SCIPOS.
- **LOBOSOFT es el equipo autor**, y debe aparecer como firma discreta, no como
  identidad principal. Hoy el menú lateral usa el logo de LOBOSOFT como marca
  principal (`apps/frontend/web-shell/public/logo-lobosoft.png`); eso invierte la
  relación y debe corregirse.
- Voz en español neutro de México, directa y sin tecnicismos innecesarios.
- El sistema no debe presentarse como facturación fiscal: el comprobante es
  explícitamente **no fiscal**.

## Evidence on Hand

- **Datos semilla reales y verificables** (`prisma/seed.ts` de cada servicio):
  4 usuarios (uno por rol), 29 privilegios, 7 productos, 5 clientes, 3
  cotizaciones y 2 turnos de caja históricos con sus ventas.
- **Especificación fuente** en `docs/pdfs/` (`Integradora 9C.docx.pdf`,
  `Avance 1 Integradora Ulises.pdf`, `SetUp General.pdf`).
- **Guía funcional** del equipo en `docs/readmes/GUIA-DEL-SISTEMA.md`.
- **Contratos OpenAPI** por servicio en `docs/02-api/openapi/`.
- **Logo existente:** `apps/frontend/web-shell/public/logo-lobosoft.png`.
- **No existen** clientes reales, testimonios, métricas de uso, precios de
  licencia ni casos de éxito. Nada de eso debe inventarse ni insinuarse en la
  interfaz.

## Product Principles

1. **El backend manda; la interfaz refleja.** Lo que se muestra, se habilita o
   se cobra proviene de la API. La interfaz nunca inventa una autorización ni un
   precio.
2. **El privilegio se tiene que ver.** Que un rol distinto cambie visiblemente
   la pantalla es la demostración del sistema, no un efecto secundario.
3. **Un turno se opera de corrido.** Las pantallas de dinero se usan con prisa y
   con gente esperando: la ruta frecuente debe ser corta y difícil de equivocar.
4. **Consistencia sobre novedad por módulo.** Los siete microfrontends deben
   sentirse un solo producto; lo compartido vive en commons.
5. **Se juzga de lejos y de cerca.** Debe sostener una proyección a distancia y
   también una revisión detallada sin guía.

## Accessibility & Inclusion

No se estableció un estándar formal (WCAG u otro) en la especificación. Los
requisitos reales que sí existen:

- **Legibilidad proyectada:** la defensa en vivo ocurre en pantalla proyectada o
  compartida, donde el contraste y el tamaño de texto se degradan. El contraste
  debe sostenerse en esas condiciones.
- **Operable sin guía:** el evaluador navega por su cuenta; etiquetas y estados
  deben explicarse solos.
- **Base heredada:** MUI aporta roles y foco por defecto, y los botones de icono
  toman su nombre accesible del `Tooltip` que los envuelve. Conservar esa
  garantía al rediseñar.
