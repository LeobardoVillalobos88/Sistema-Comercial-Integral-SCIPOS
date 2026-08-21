# API Gateway

`@scipos/gateway` (puerto **4000**). Única entrada HTTP del backend. El navegador
y la skill de Alexa solo hablan con él; los seis servicios de dominio no publican
puerto al exterior.

## Qué hace

- **Enruta.** `/api/<servicio>/*` va al puerto que corresponda según la tabla de
  `src/config/servicios.ts`: seguridad, productos, clientes, cotizaciones,
  ventas-caja y reportes.
- **Verifica el token en el borde.** Firma RS256 contra el JWKS de seguridad,
  emisor, audiencia y lista de revocados, antes de proxyar. Los servicios lo
  vuelven a verificar por su cuenta: es defensa en profundidad, no desconfianza.
- **Quita la cabecera `x-usuario-id` de toda petición externa.** Esa cabecera es
  el canal de identidad **entre servicios**. Si se pudiera mandar desde afuera,
  cualquiera se haría pasar por el administrador escribiendo su identificador.
  Desde fuera, la identidad solo puede llegar como token Bearer.
- **Contesta por el servicio caído.** Si un servicio no responde, devuelve 502 en
  JSON con la misma forma de error que el resto del sistema, en vez de una página
  de error del proxy. Así el frontend no necesita un caso especial para "el error
  no venía en JSON".

```jsonc
{ "estatus": 502, "mensaje": "El servicio \"productos\" no está disponible.",
  "error": "Servicio no disponible" }
```

## CORS

`origenesPermitidos()` lee `ORIGENES_PERMITIDOS` (separados por comas) y, si está
vacía, cae a los puertos locales de desarrollo (3001-3007).

En el despliegue queda vacía a propósito: detrás de nginx la interfaz y la API
comparten origen, así que no hay peticiones de origen cruzado y no hay lista que
actualizar cada vez que cambia el dominio.

## Desarrollo local

```bash
cp apps/backend/gateway/.env.example apps/backend/gateway/.env
pnpm dev --filter @scipos/gateway
```

Conviene levantarlo con `pnpm dev --filter` y no con `pnpm --filter … dev`: el
primero pasa por Turborepo, que compila `@scipos/backend-commons` antes.

## Comprobación rápida

```bash
curl -i http://localhost:4000/api/seguridad/usuarios
```

Debe responder **401**. Si respondiera 200, el sistema de privilegios no estaría
aplicándose y habría que detenerse a revisar.
