<!--
CONTRATO DE DIRECCIÓN

TESIS: la autoridad se pinta. Lo que puedes hacer está rotulado en el muro; lo
que no, no está. Rechaza el panel administrativo de barra lateral azul marino
con tarjetas flotantes que envía toda la categoría.

MUNDO PROPIO: campos de esmalte profundo (azul noche dominante, ocre, rojo
señal, verde botella) sobre plano de trabajo claro y frío. A esa profundidad de
azul, el ocre y el rótulo a escala display cargan la identidad. Mayúsculas
condensadas con sombra dura desplazada. Bandas rectas, sin sombras difusas.
Cifras tabulares siempre.

HISTORIA: el operador entiende de un vistazo qué puede hacer y cuánto dinero
hay. El evaluador ve que cambiar de rol repinta el tablero.

PRIMERA PANTALLA: el acceso es un muro rotulado — SCIPOS a escala de rótulo
ocupando el lienzo, con la placa de credenciales montada encima.

FORMA: Rotulación Comercial, candidato 5 de la lista ordenada por resonancia,
asignado por semilla 4a1fccca (scope direction, mode operate).
-->

---
name: SCIPOS
description: Sistema comercial rotulado — la autoridad se pinta, el dinero se lee de lejos
colors:
  azul-noche: "#101F52"
  azul-noche-hondo: "#060F33"
  ocre-rotulo: "#D98A00"
  rojo-senal: "#C31F1F"
  verde-botella: "#1B6B3A"
  tinta: "#0E1420"
  tinta-suave: "#54607A"
  papel: "#EEF1F6"
  panel: "#FFFFFF"
  regla: "#C3CBD9"
typography:
  display:
    fontFamily: "Archivo Black, Archivo, system-ui, sans-serif"
    fontSize: "clamp(2rem, 6vw, 4.5rem)"
    fontWeight: 900
    lineHeight: 0.92
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    letterSpacing: "0.12em"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
  cifra:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontWeight: 700
    fontFeature: "tnum"
rounded:
  banda: "0px"
  control: "2px"
  panel-con-banda: "0px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.azul-noche}"
    textColor: "{colors.panel}"
    rounded: "{rounded.control}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.azul-noche-hondo}"
  button-destructive:
    backgroundColor: "{colors.rojo-senal}"
    textColor: "{colors.panel}"
    rounded: "{rounded.control}"
  chip-privilegio:
    backgroundColor: "{colors.ocre-rotulo}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.control}"
---

# Design System: SCIPOS

## Overview

**Creative North Star: "El Muro Rotulado"**

SCIPOS se ve como un muro de comercio pintado a mano: campos de esmalte
saturado, mayúsculas condensadas con sombra dura, paneles enmarcados con banda.
La rotulación existe para que alguien con prisa lea desde lejos y no se
equivoque — la misma exigencia que tiene un punto de venta con un cliente
esperando, y la misma que tiene una defensa proyectada donde la luz del salón
borra todo lo sutil.

El mundo carga el mecanismo del producto sin metáfora forzada: un rótulo declara
lo disponible. Lo que no está pintado, no se vende. Los privilegios funcionan
igual — una acción que tu rol no tiene no aparece atenuada, simplemente no está
en el muro. Cambiar de rol repinta el tablero.

Se toma el **sistema** de la rotulación, no su nostalgia: contraste, condensadas,
campos de color, sombra desplazada, flechas. Nunca su desgaste — sin textura de
pintura descarapelada, sin bordes envejecidos, sin guiños de cantina.

**Key Characteristics:**
- Plano de trabajo claro y frío; el color vive en el cromo, no bajo los datos
- Cero sombras difusas: la profundidad es gráfica, no atmosférica
- Mayúsculas condensadas para todo lo estructural; cifras siempre tabulares
- Esquinas prácticamente rectas (2px en controles, 0px en bandas), nunca cápsulas
- Alto contraste como requisito de operación, no como estilo

## Colors

Paleta de esmalte comercial: pocos colores, muy saturados, cada uno con trabajo
asignado.

### Primary
- **Azul Noche** (#101F52): el color del muro. Carga todo el cromo — menú
  lateral, barra superior, bandas de encabezado, acción primaria. Es el campo
  dominante a escala de página, no un acento suelto.
- **Azul Noche Hondo** (#060F33): estado presionado y sombra dura del rótulo.

### Secondary
- **Ocre Rótulo** (#D98A00): marca lo que hay que mirar — totales, saldos,
  privilegios concedidos. Es un color de **campo**, con tinta encima; nunca
  texto ocre sobre blanco.

### Tertiary
- **Rojo Señal** (#C31F1F): destrucción y alerta. Eliminar, cancelar, saldo en
  contra.
- **Verde Botella** (#1B6B3A): confirmación y turno abierto.

### Neutral
- **Tinta** (#0E1420): todo el texto de trabajo.
- **Tinta Suave** (#54607A): etiquetas y texto secundario.
- **Papel** (#EEF1F6): fondo del plano de trabajo. Frío, nunca crema.
- **Panel** (#FFFFFF): superficie de tablas y formularios.
- **Regla** (#C3CBD9): líneas y divisiones.

### Named Rules

**La Regla del Muro.** El azul noche cubre el cromo completo — barra lateral y
superior, bandas de sección. No se diluye en tintes claros ni se reparte en
acentos pequeños. O es campo, o no está.

**La Regla del Campo.** Ocre y rojo son colores de fondo con tinta encima, nunca
color de texto sobre blanco. Es como funciona la pintura de rótulo y además
resuelve el contraste.

**La Regla del Plano Limpio.** Bajo los datos no hay color de marca. Tablas,
formularios y cifras viven sobre papel o panel. El color enmarca el trabajo; no
se mete debajo.

## Typography

**Display Font:** Archivo Black (con Archivo, system-ui, sans-serif)
**Body Font:** Archivo (con system-ui, sans-serif)
**Label Font:** Archivo, peso 700, versalitas espaciadas

**Character:** una sola familia sostiene todo el sistema; el peso y el ancho
hacen la jerarquía. Archivo es una grotesca de alto rendimiento con rango
completo: en negro da la voz del rotulista, en regular sostiene la densidad de
una tabla. Usar una familia y no dos es coherente con el mundo — un rotulista
pinta todo el muro con la misma mano.

### Hierarchy
- **Display** (900, clamp 2rem–4.5rem, 0.92): el nombre del sistema en el acceso
  y los números que dominan una pantalla. Lleva sombra dura desplazada.
- **Headline** (800, 1.5rem, 1.1): títulos de módulo y de sección.
- **Title** (700, 1.125rem, 1.2): encabezados de panel.
- **Body** (400, 0.9375rem, 1.55): texto de trabajo y celdas.
- **Label** (700, 0.75rem, +0.12em, mayúsculas): etiquetas de campo, encabezados
  de columna, chips de privilegio.

### Named Rules

**La Regla de la Cifra.** Todo número que represente dinero, cantidad o folio va
en cifras tabulares (`font-variant-numeric: tabular-nums`) y alineado a la
derecha. Las columnas de dinero tienen que poder compararse de un vistazo.

**La Regla de la Sombra Dura.** El desplazamiento del rótulo es sólido y sin
difuminado (`text-shadow: 3px 3px 0`), reservado al nivel display. Nunca se
aplica a texto de trabajo.

## Layout

Plano de trabajo sobre papel frío con paneles blancos enmarcados por regla de
1px. El menú lateral es un campo de esmalte de ancho fijo; la barra superior es
una banda del mismo esmalte. El contenido respira con el ritmo de 8px
(xs 4 · sm 8 · md 16 · lg 24 · xl 40), con más espacio arriba de un encabezado
que abajo.

Las tablas son el componente central del sistema y mandan sobre la decoración:
ancho completo del panel, encabezado en banda, desbordamiento horizontal propio
para que la página nunca se desplace de lado. En pantallas chicas los diálogos
ocupan casi todo el viewport y el menú lateral se vuelve cajón temporal.

## Elevation & Depth

**Sin sombras difusas.** La pintura es plana. La profundidad se construye con
tres recursos gráficos: el contraste entre campo de esmalte y papel, la regla de
1px que enmarca cada panel, y la sombra dura desplazada del nivel display.

### Named Rules

**La Regla de la Pintura Plana.** Ninguna superficie lleva `box-shadow`
difuminado. Un elemento que necesita destacarse cambia de campo de color o gana
banda, no halo. Esto reemplaza por completo el vocabulario de elevación heredado
de Material.

## Shapes

Esquinas prácticamente rectas: **0px** en bandas y campos de esmalte a sangre,
**2px** en controles interactivos para que sigan leyéndose como operables. Nunca
cápsulas ni radios grandes: una esquina redondeada es lenguaje de tarjeta de
software, no de panel pintado.

Los paneles se enmarcan con regla de 1px; las secciones importantes ganan una
banda superior sólida de 4px en el color que les corresponde.

### Named Rules

**La Regla de la Banda Recta.** Un panel que lleva banda va a **esquina recta
(0px)**. Banda gruesa sobre esquina redondeada es el gesto que delata a una
interfaz generada: la banda pelea con la curva. En este mundo la banda es franja
de pintura sobre panel plano, y una franja de pintura no tiene esquina redonda.

## Components

Los componentes se construyen sobre MUI, que es obligatorio por el brief. La
transformación ocurre en el tema, no reemplazando la librería.

### Buttons
- **Shape:** casi recto (2px), sin elevación
- **Primary:** campo azul noche con texto panel, etiqueta en mayúsculas
  espaciadas
- **Hover / Focus:** oscurece a azul noche hondo; el foco es un contorno
  sólido de 2px, nunca un halo difuso
- **Destructive:** campo rojo señal
- **Ghost:** solo texto en tinta con subrayado de regla

### Chips
- **Privilegio concedido:** campo ocre con tinta encima
- **Estado activo:** campo verde botella con texto panel
- **Estado inactivo:** contorno de regla sobre panel, texto tinta suave

### Cards / Containers
- **Corner Style:** 2px sin banda; **0px** cuando llevan banda (La Regla de la
  Banda Recta)
- **Background:** panel blanco sobre papel frío
- **Shadow Strategy:** ninguna (ver Elevation)
- **Border:** regla de 1px; banda superior de 4px cuando la sección lo amerita
- **Internal Padding:** md a lg

### Inputs / Fields
- **Style:** contorno de regla sobre panel, esquina de 2px, etiqueta en
  mayúsculas espaciadas encima
- **Focus:** el contorno engrosa a 2px en azul noche
- **Error:** contorno rojo señal con mensaje en tinta, no en rojo

### Navigation
- Menú lateral como campo de esmalte continuo. El elemento activo se marca con
  **banda vertical sólida de 4px en ocre** más fondo aclarado, no con píldora
  redondeada. Las etiquetas van en versalitas espaciadas.
- Solo aparecen los módulos cuyo privilegio tiene el usuario: el muro se repinta
  por rol.

## Do's and Don'ts

### Do:
- **Do** usar el azul noche como campo completo del cromo (La Regla del Muro).
- **Do** poner ocre y rojo como fondo con tinta encima (La Regla del Campo).
- **Do** dar cifras tabulares y alineación derecha a todo dinero, cantidad y
  folio (La Regla de la Cifra).
- **Do** mantener el plano de datos sobre papel o panel, sin color de marca
  debajo (La Regla del Plano Limpio).
- **Do** conservar el nombre accesible que MUI da a los botones de icono a
  través de su `Tooltip`.

### Don't:
- **Don't** usar `box-shadow` difuminado en ninguna superficie (La Regla de la
  Pintura Plana).
- **Don't** simular pintura envejecida, textura descarapelada, bordes gastados
  ni guiños de cantina. Se toma el sistema, no la nostalgia.
- **Don't** usar radios mayores a 2px ni formas de cápsula.
- **Don't** aplicar la sombra dura desplazada a texto de trabajo; es exclusiva
  del nivel display.
- **Don't** introducir otra librería visual: MUI es obligatorio por el brief y
  la transformación vive en el tema.
- **Don't** dejar que la expresión estorbe la tarea. Si un recurso del mundo
  compite con leer una cifra o encontrar un botón, gana la tarea.
