# Arquitectura de SCIPOS

Los documentos que explican **por qué** el sistema está hecho como está. Para
saber **qué hace** cada módulo, la
[guía del sistema](../readmes/GUIA-DEL-SISTEMA.md); para levantarlo, el
[README](../../README.md); para publicarlo,
[despliegue en AWS](../DESPLIEGUE-AWS.md).

| Documento | Qué contesta |
|---|---|
| [Decisiones técnicas](./decisiones-tecnicas.md) | Las doce decisiones que dieron forma al sistema, con lo que se descartó y por qué |
| [Patrones de diseño y SOLID](./patrones-y-solid.md) | Qué patrón se aplicó, en qué archivo y qué problema resuelve. Los cinco principios con su ejemplo |
| [Arquitectura del frontend](./microfrontends.md) | Armazón, módulos, consumo de API, estado, permisos e integración visual |
| [Arquitectura del backend](./microservicios.md) | Servicios, responsabilidades, comunicación, datos, seguridad y manejo de fallos |
| [Estructura del repositorio](./estructura-del-repositorio.md) | Qué hay en cada carpeta, qué se decidió no crear y cómo incorporar a alguien nuevo |
| [Estrategia de ramas](./estrategia-de-ramas.md) | Ramas base, integración, nombres, tipos, borrado y prevención de conflictos |

---

## El sistema en una pantalla

```
                        Navegador / Alexa
                               │
                        ┌──────▼──────┐
                        │    nginx    │   único puerto publicado
                        └──────┬──────┘
                    /          │          /api
              ┌────────────┐   │   ┌─────────────┐
              │ web-shell  │   │   │   gateway   │  verifica el token en el borde
              │ (armazón)  │   │   │    :4000    │  y quita x-usuario-id externo
              └─────┬──────┘   │   └──────┬──────┘
                    │                     │
   ┌────────────────┼─────────┐    ┌──────┴───────┬────────┬─────────┬──────────┐
   │productos-front │clientes │    │ seguridad    │productos│clientes│cotizacion│
   │cotizaciones    │pos-caja │    │   :4001      │  :4002  │ :4003  │  :4004   │
   │reportes        │login    │    └──────┬───────┴────┬────┴───┬────┴────┬─────┘
   └────────────────┴─────────┘           │      ventas-caja :4005  reportes :4006
                                          │            │        │         │
                                    ┌─────┴────────────┴────────┴─────┐
                                    │  PostgreSQL (un esquema por     │
                                    │  servicio)  ·  Redis            │
                                    └─────────────────────────────────┘
```

Reportes no aparece conectado a la base a propósito: no tiene esquema. Agrega por
REST desde los demás.

## Dónde se responde cada criterio de la rúbrica

| Criterio | Dónde |
|---|---|
| Decisiones técnicas y justificación | [decisiones-tecnicas.md](./decisiones-tecnicas.md) |
| Microfrontends / arquitectura frontend | [microfrontends.md](./microfrontends.md) |
| Microservicios / arquitectura backend | [microservicios.md](./microservicios.md) |
| Patrones de diseño en frontend y backend | [patrones-y-solid.md](./patrones-y-solid.md) |
| Scaffolding y arquitectura del repositorio | [estructura-del-repositorio.md](./estructura-del-repositorio.md) y [estrategia-de-ramas.md](./estrategia-de-ramas.md) |
| Multirol y multiprivilegio | [microfrontends.md](./microfrontends.md#cómo-se-muestran-u-ocultan-funciones-por-privilegio) y [microservicios.md](./microservicios.md#cómo-se-protegen-los-endpoints) |
| Diseño responsive | [microfrontends.md](./microfrontends.md#diseño-adaptable) |
| Integraciones adicionales | [skill de Alexa](../readmes/cumplimiento-rubrica-alexa.md) |
| Arquitectura cloud y calidad del despliegue | [despliegue en AWS](../DESPLIEGUE-AWS.md) |

## Cómo comprobar lo que aquí se afirma

La rúbrica no da puntos por tecnologías mencionadas y no demostradas. Estos
comandos son la demostración:

```bash
pnpm lint        # formato y reglas de estilo sobre 305 archivos
pnpm test        # 129 pruebas en 6 paquetes, sin base de datos ni navegador
pnpm build       # los 7 frontends y los 8 de backend; verifica también los tipos
```

Y sobre el sistema publicado, la comprobación de una línea de que los privilegios
se validan en el servidor y no solo en la interfaz:

```bash
curl -i https://<dominio>/api/seguridad/usuarios     # debe responder 401
```
