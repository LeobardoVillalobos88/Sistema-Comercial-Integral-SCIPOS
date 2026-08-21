# Microfrontend de acceso

`@scipos/login-front`. La pantalla de inicio de sesión.

Es el único microfrontend **sin puerto de desarrollo propio**, y no es un olvido:
no tiene sentido levantarlo solo. Es un componente puro que el armazón monta en
su ruta `/login`; sin la sesión que produce, no hay nada más que enseñar.

```tsx
// web-shell/src/app/login/page.tsx
import { PantallaLogin } from "@scipos/login-front";
```

## Qué hace

Pide correo y contraseña y llama a `iniciarSesion()` de `usePermisos()`, que
detrás hace `POST /seguridad/auth/login` y guarda el access y el refresh token en
el `sessionStorage` de la pestaña.

Que la sesión viva por pestaña y no por navegador tiene una consecuencia útil el
día de la demostración: una ventana normal y una de incógnito pueden tener dos
usuarios distintos al mismo tiempo, y se pueden enseñar dos roles lado a lado sin
cerrar sesión.

## Por qué se ve distinta al resto

Vive fuera del armazón, junto con las pantallas de error, así que no hereda el
fondo claro de la aplicación. Usa los tokens `SOBRE_ESMALTE` del tema, pensados
para el texto sobre las superficies oscuras que MUI no cubre con su paleta clara.

Si pasara por el armazón, además, habría un problema práctico: `AppShell`
redirige al login cuando no hay sesión, y el login es precisamente donde no hay
sesión todavía.

## Credenciales de los usuarios semilla

Están documentadas en el [README raíz](../../../README.md). En un despliegue
expuesto conviene sustituirlas con las variables `SEED_*_PASSWORD`.
