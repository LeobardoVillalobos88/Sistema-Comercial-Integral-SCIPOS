# Despliegue de SCIPOS en AWS

Procedimiento para dejar el sistema corriendo en una instancia EC2 con Docker
Compose y nginx como único punto de entrada.

Al terminar tendrás la aplicación completa —interfaz, gateway, los seis
servicios, Postgres y Redis— servida desde la IP pública de la instancia.

---

## Cómo queda armado

```
                 Internet
                    │
                    │  puerto 80
              ┌─────▼─────┐
              │   nginx   │   único contenedor con puerto publicado
              └─────┬─────┘
            ┌───────┴────────┐
            │                │
      /  ┌──▼───────┐   /api ┌▼─────────┐
         │ web-shell│        │ gateway  │
         └──────────┘        └────┬─────┘
                                  │
        ┌──────────┬──────────┬───┴──────┬──────────────┬──────────┐
        │          │          │          │              │          │
   ┌────▼────┐┌────▼────┐┌────▼────┐┌────▼─────┐┌───────▼───┐┌─────▼────┐
   │seguridad││productos││ clientes││cotizacion││ventas-caja││ reportes │
   │  :4001  ││  :4002  ││  :4003  ││   :4004  ││   :4005   ││  :4006   │
   └────┬────┘└────┬────┘└────┬────┘└────┬─────┘└─────┬─────┘└──────────┘
        └──────────┴──────────┴──────────┴────────────┘
                              │
                    ┌─────────┴─────────┐
              ┌─────▼─────┐       ┌─────▼─────┐
              │ Postgres  │       │   Redis   │
              └───────────┘       └───────────┘
```

La interfaz y la API salen por el mismo origen, así que el navegador no hace
peticiones de origen cruzado. Todo lo demás vive en la red interna de Docker y
**no** se alcanza desde internet.

---

## 1. Crear la instancia EC2

En la consola de AWS, EC2 → *Launch instance*:

| Campo | Valor |
|---|---|
| Nombre | `scipos-produccion` |
| AMI | Ubuntu Server 24.04 LTS (x86_64) |
| Tipo de instancia | `t3.medium` (4 GB) para construir sin sobresaltos, o `t3.small` (2 GB) con memoria de intercambio |
| Par de llaves | crea uno y guarda el `.pem` |
| Almacenamiento | **30 GB** gp3 |

Sobre el tamaño, por si te tienta bajarlo:

- **La memoria es el cuello de botella, no el procesador.** Compilar el
  monorepo levanta varias compilaciones de TypeScript a la vez, y cada una
  reserva cientos de megabytes. Las imágenes ya limitan la concurrencia a dos
  tareas simultáneas justamente para que quepa en máquinas pequeñas, pero por
  debajo de 2 GB no alcanza.
- **Con `t3.small` añade memoria de intercambio antes de construir** (paso 2).
  No es opcional: sin ella el demonio de Docker puede morir a mitad de la
  compilación, y lo hace sin dejar un error legible — parece que el build se
  quedó congelado.
- **`t2.micro` / `t3.micro` (1 GB) no alcanza** ni con intercambio. Si la capa
  gratuita te obliga a usar micro, construye las imágenes en otra máquina y
  súbelas a un registro.
- **20 GB de disco se quedan cortos.** Las imágenes de Node con el monorepo
  completo ocupan varios GB.

Una vez construidas, las imágenes corren cómodas: el consumo alto es solo
durante la compilación.

### Grupo de seguridad

Solo dos reglas de entrada:

| Tipo | Puerto | Origen | Para qué |
|---|---|---|---|
| SSH | 22 | **tu IP**, no `0.0.0.0/0` | administrar la instancia |
| HTTP | 80 | `0.0.0.0/0` | servir la aplicación |

Los puertos 4000-4006, 5432 y 6379 **no se abren**. Quedan dentro de la red de
Docker; publicarlos expondría la base de datos a internet.

> Asigna una **IP elástica** a la instancia. Sin ella la IP pública cambia con
> cada reinicio y tendrías que reconfigurar todo.

---

## 2. Preparar la instancia

Conéctate:

```bash
ssh -i tu-llave.pem ubuntu@TU_IP_PUBLICA
```

Instala Docker:

```bash
sudo apt-get update && sudo apt-get upgrade -y
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

Cierra la sesión y vuelve a entrar para que tome el grupo `docker`. Verifica:

```bash
docker --version && docker compose version
```

### Memoria de intercambio (obligatorio en `t3.small`)

Con 2 GB de RAM la compilación se queda sin memoria y el demonio de Docker
muere a media construcción, sin mensaje de error claro. Añade 4 GB de
intercambio antes de continuar:

```bash
sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Compruébalo con `free -h`: la fila `Swap` debe mostrar 4 GB. En `t3.medium`
este paso es opcional.

---

## 3. Clonar el proyecto

```bash
sudo apt-get install -y git
git clone https://github.com/LeobardoVillalobos88/Sistema-Comercial-Integral-SCIPOS.git
cd Sistema-Comercial-Integral-SCIPOS
git checkout main
```

---

## 4. Generar las llaves de firma

El servicio de seguridad firma los tokens con una llave RSA privada y publica
la pública en su JWKS. Las llaves **no vienen en el repositorio**: cada
instalación genera las suyas, porque quien tenga la privada puede emitir
tokens válidos.

Necesitas Node solo para este paso. **Instálalo desde NodeSource, no con
`apt-get install nodejs`**: los repositorios de Ubuntu traen Node 18 y el
gestor de paquetes del proyecto requiere Node 22 o superior.

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
corepack enable
pnpm install --frozen-lockfile --ignore-scripts
pnpm generar:llaves
pnpm llaves:entorno
```

El último comando imprime dos líneas listas para pegar en el archivo del
siguiente paso:

```
JWT_PRIVATE_KEY=LS0tLS1CRUdJTiBQUklWQVRF...
JWT_PUBLIC_KEY=LS0tLS1CRUdJTiBQVUJMSUM...
```

---

## 5. Llenar las credenciales

Este es el **único** archivo que hay que editar:

```bash
cp .env.example .env
nano .env
```

Lo mínimo que debes cambiar:

| Variable | Qué poner |
|---|---|
| `POSTGRES_PASSWORD` | una contraseña larga y propia |
| `REDIS_PASSWORD` | otra contraseña larga y propia |
| `JWT_PRIVATE_KEY` | la línea que imprimió `pnpm llaves:entorno` |
| `JWT_PUBLIC_KEY` | la otra línea |
| `EJECUTAR_SEMILLA` | `true` **solo para el primer arranque** |
| `SEED_*_PASSWORD` | contraseñas propias para los cuatro usuarios |

El resto de las variables ya viene con valores correctos para este montaje.

> Las contraseñas de los usuarios semilla están documentadas en el README y son
> públicas. Si la instancia queda expuesta a internet y no defines las
> variables `SEED_*_PASSWORD`, cualquiera que lea el repositorio puede entrar
> como administrador.

---

## 6. Construir y levantar

```bash
pnpm prod:build
pnpm prod:up
```

La primera construcción tarda entre 5 y 15 minutos según el tipo de instancia.

Comprueba que todos los contenedores estén arriba y sanos:

```bash
docker compose -f infra/docker/compose/docker-compose.prod.yml --env-file .env ps
```

Los servicios deben aparecer como `healthy`. Los que tarden más de un minuto
en llegar a ese estado casi siempre están esperando a la base de datos.

---

## 7. Cargar los datos iniciales

Si pusiste `EJECUTAR_SEMILLA=true` antes de levantar, ya están cargados: el
catálogo de privilegios, la matriz de roles, los cuatro usuarios y los datos de
demostración.

**Vuelve a ponerlo en `false`** y reinicia, para que no se recarguen en cada
arranque:

```bash
sed -i 's/^EJECUTAR_SEMILLA=true/EJECUTAR_SEMILLA=false/' .env
pnpm prod:up
```

Si lo olvidaste en el primer arranque, siembra ahora:

```bash
docker compose -f infra/docker/compose/docker-compose.prod.yml --env-file .env \
  exec seguridad pnpm exec tsx prisma/seed.ts
```

Los demás servicios se siembran igual, cambiando `seguridad` por `productos`,
`clientes`, `cotizaciones` o `ventas-caja`.

---

## 8. Verificar

Abre `http://TU_IP_PUBLICA` en el navegador: debe aparecer la pantalla de
acceso. Entra con `admin@scipos.com` y la contraseña que definiste.

Desde la terminal:

```bash
# La interfaz responde
curl -I http://localhost

# El gateway responde y rechaza sin token, que es lo correcto
curl -i http://localhost/api/seguridad/usuarios
```

Esa segunda llamada debe devolver **401**. Si devolviera 200, el sistema de
privilegios no estaría aplicándose y habría que detenerse a revisar.

---

## Operación diaria

```bash
pnpm prod:logs                    # seguir los registros de todos los servicios
pnpm prod:down                    # detener todo (los datos se conservan)
pnpm prod:up                      # volver a levantar

# Registros de un solo servicio
docker compose -f infra/docker/compose/docker-compose.prod.yml --env-file .env \
  logs -f seguridad
```

### Actualizar a una versión nueva

```bash
git pull origin main
pnpm prod:build
pnpm prod:up
```

Las migraciones pendientes se aplican solas al arrancar cada servicio.

### Respaldar la base de datos

```bash
docker compose -f infra/docker/compose/docker-compose.prod.yml --env-file .env \
  exec db pg_dump -U scipos scipos > respaldo-$(date +%F).sql
```

---

## Problemas comunes

**La construcción se queda congelada, muere sin mensaje, o dice "Killed".**
Es falta de memoria, y es el fallo más común de este despliegue. Confirma que
tienes intercambio activo con `free -h`; si la fila `Swap` está en cero,
vuelve al paso 2 y créalo.

Si ya lo tienes y aun así falla, baja la concurrencia de la compilación a una
sola tarea editando `--concurrency=2` a `--concurrency=1` en
`infra/docker/Dockerfile.backend`. Tardará bastante más, pero cabe en menos
memoria.

Síntoma revelador: si `docker info` empieza a responder errores mientras
construyes, no es un problema del proyecto — el demonio se quedó sin memoria y
murió.

**Un servicio se reinicia en bucle.**
Mira sus registros. Si el error menciona la base de datos, casi siempre es que
`POSTGRES_PASSWORD` cambió después del primer arranque: el volumen conserva la
contraseña vieja. Para empezar de cero —**se pierden todos los datos**—:

```bash
docker compose -f infra/docker/compose/docker-compose.prod.yml --env-file .env down -v
```

**El navegador carga la interfaz pero todo aparece vacío.**
Abre la consola del navegador. Si hay errores 401, el token no está llegando:
revisa que `JWT_PRIVATE_KEY` y `JWT_PUBLIC_KEY` sean el par que generaste y no
llaves de instalaciones distintas.

**`403` al pulsar un botón que debería funcionar.**
Es el sistema de privilegios operando: el usuario no tiene ese permiso. Se
asigna desde *Usuarios* con una cuenta de administrador.

**El disco se llenó.**
```bash
docker system prune -a --volumes=false
```

---

## Servir por HTTPS

El montaje actual sirve por HTTP. Para publicar con certificado hace falta un
dominio apuntando a la IP elástica; con eso, la ruta más corta es añadir un
contenedor de Certbot junto a nginx y montar el certificado emitido en el
bloque `server`, cambiando `listen 80` por `listen 443 ssl` y dejando un
`server` en el 80 que redirija.

Mientras no exista el dominio no se puede emitir el certificado: Let's Encrypt
valida contra un nombre, no contra una IP.

---

## Notas de arquitectura

**Una sola imagen para los siete backends.** El gateway y los seis servicios
comparten monorepo, dependencias y librería común. Construirlos por separado
produciría siete imágenes casi idénticas, multiplicando por siete el tiempo de
construcción y el disco de la instancia sin ninguna ganancia. Cada servicio
sigue siendo un contenedor y un proceso independiente, con su puerto y su
esquema de base de datos propios; lo único que comparten es el artefacto del
que arrancan, y cada contenedor elige qué proceso levantar con su `working_dir`.

**Un solo Postgres con un esquema por servicio.** Ningún servicio lee el
esquema de otro: los datos cruzados viajan por REST. Separar en instancias
distintas es posible sin tocar el código —basta cambiar cada `DATABASE_URL`—
pero para una sola máquina no aporta nada.

**La ruta de la API es relativa.** Next resuelve las variables `NEXT_PUBLIC_*`
al compilar, no al arrancar. Con una dirección absoluta habría que reconstruir
la imagen cada vez que cambiara el dominio o la IP; con `/api` y el proxy
inverso, la misma imagen sirve en cualquier host.
