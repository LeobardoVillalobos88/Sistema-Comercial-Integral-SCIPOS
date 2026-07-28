import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { PrivilegiosService } from "./privilegios.service";

interface OpcionesUsuario {
  rolClave?: string;
  estado?: "ACTIVO" | "INACTIVO";
  accesoTotal?: boolean;
  privilegiosDelRol?: string[];
  concedidos?: string[];
  revocados?: string[];
}

/** Usuario tal como lo devuelve Prisma con su rol y sus ajustes individuales. */
function usuarioFalso(opciones: OpcionesUsuario = {}) {
  const {
    rolClave = "VENDEDOR",
    estado = "ACTIVO",
    accesoTotal = false,
    privilegiosDelRol = [],
    concedidos = [],
    revocados = [],
  } = opciones;

  return {
    id: "u-001",
    rolClave,
    estado,
    rol: {
      accesoTotal,
      privilegios: privilegiosDelRol.map((privilegioClave) => ({ privilegioClave })),
    },
    privilegios: [
      ...concedidos.map((privilegioClave) => ({ privilegioClave, concedido: true })),
      ...revocados.map((privilegioClave) => ({ privilegioClave, concedido: false })),
    ],
  };
}

interface OpcionesServicio {
  usuario?: ReturnType<typeof usuarioFalso> | null;
  catalogo?: string[];
  cacheado?: unknown;
}

/**
 * Arma el servicio con dobles de Prisma y Redis, y expone un registro de
 * llamadas para poder afirmar sobre la caché.
 */
function crearServicio(opciones: OpcionesServicio = {}) {
  const { usuario = usuarioFalso(), catalogo = [], cacheado = null } = opciones;

  const registro = {
    lecturasABaseDeDatos: 0,
    clavesLeidas: [] as string[],
    clavesEscritas: [] as string[],
    clavesEliminadas: [] as string[],
    ttlUsado: undefined as number | undefined,
    valorEnCache: undefined as unknown,
  };

  const prisma = {
    usuario: {
      findUnique: async () => {
        registro.lecturasABaseDeDatos += 1;
        return usuario;
      },
      findMany: async () => [{ id: "u-001" }, { id: "u-002" }],
    },
    privilegio: {
      findMany: async () => catalogo.map((clave) => ({ clave })),
    },
  } as unknown as PrismaService;

  const redis = {
    get: async (clave: string) => {
      registro.clavesLeidas.push(clave);
      return cacheado;
    },
    set: async (clave: string, valor: unknown, ttlSegundos: number) => {
      registro.clavesEscritas.push(clave);
      registro.valorEnCache = valor;
      registro.ttlUsado = ttlSegundos;
    },
    del: async (...claves: string[]) => {
      registro.clavesEliminadas.push(...claves);
    },
  } as unknown as RedisService;

  return { servicio: new PrivilegiosService(prisma, redis), registro };
}

describe("PrivilegiosService.verificar", () => {
  it("rechaza a un usuario que no existe", async () => {
    const { servicio } = crearServicio({ usuario: null });

    const resultado = await servicio.verificar("fantasma", "productos:ver");

    assert.deepEqual(resultado, { tiene: false, motivo: "USUARIO_NO_ENCONTRADO" });
  });

  it("rechaza a un usuario inactivo aunque su rol tenga el privilegio", async () => {
    const { servicio } = crearServicio({
      usuario: usuarioFalso({ estado: "INACTIVO", privilegiosDelRol: ["productos:ver"] }),
    });

    const resultado = await servicio.verificar("u-001", "productos:ver");

    assert.deepEqual(resultado, { tiene: false, motivo: "USUARIO_INACTIVO" });
  });

  it("concede un privilegio heredado del rol", async () => {
    const { servicio } = crearServicio({
      usuario: usuarioFalso({ privilegiosDelRol: ["productos:ver"] }),
    });

    assert.deepEqual(await servicio.verificar("u-001", "productos:ver"), { tiene: true });
  });

  it("concede un privilegio otorgado de forma individual", async () => {
    const { servicio } = crearServicio({
      usuario: usuarioFalso({ concedidos: ["productos:crear"] }),
    });

    assert.deepEqual(await servicio.verificar("u-001", "productos:crear"), { tiene: true });
  });

  it("niega un privilegio que el usuario no tiene por ninguna vía", async () => {
    const { servicio } = crearServicio({
      usuario: usuarioFalso({ privilegiosDelRol: ["productos:ver"] }),
    });

    const resultado = await servicio.verificar("u-001", "productos:eliminar");

    assert.deepEqual(resultado, { tiene: false, motivo: "SIN_PRIVILEGIO" });
  });

  it("la revocación individual gana sobre el privilegio del rol", async () => {
    const { servicio } = crearServicio({
      usuario: usuarioFalso({
        privilegiosDelRol: ["productos:ver", "productos:eliminar"],
        revocados: ["productos:eliminar"],
      }),
    });

    const resultado = await servicio.verificar("u-001", "productos:eliminar");

    assert.deepEqual(resultado, { tiene: false, motivo: "SIN_PRIVILEGIO" });
  });

  it("la revocación individual gana incluso sobre un rol con acceso total", async () => {
    const { servicio } = crearServicio({
      usuario: usuarioFalso({
        rolClave: "ADMINISTRADOR",
        accesoTotal: true,
        revocados: ["productos:eliminar"],
      }),
    });

    const resultado = await servicio.verificar("u-001", "productos:eliminar");

    assert.deepEqual(resultado, { tiene: false, motivo: "SIN_PRIVILEGIO" });
  });

  it("un rol con acceso total concede cualquier privilegio no revocado", async () => {
    const { servicio } = crearServicio({
      usuario: usuarioFalso({ rolClave: "ADMINISTRADOR", accesoTotal: true }),
    });

    assert.deepEqual(await servicio.verificar("u-001", "reportes:ver"), { tiene: true });
  });
});

describe("PrivilegiosService: cálculo de privilegios efectivos", () => {
  it("suma los del rol con los concedidos, resta los revocados y no repite claves", async () => {
    const { servicio } = crearServicio({
      usuario: usuarioFalso({
        privilegiosDelRol: ["productos:ver", "clientes:ver"],
        concedidos: ["clientes:ver", "cotizaciones:crear"],
        revocados: ["productos:ver"],
      }),
    });

    const { privilegios } = await servicio.privilegiosDeUsuario("u-001");

    assert.deepEqual(privilegios, ["clientes:ver", "cotizaciones:crear"]);
  });

  it("entrega los privilegios efectivos ordenados alfabéticamente", async () => {
    const { servicio } = crearServicio({
      usuario: usuarioFalso({
        privilegiosDelRol: ["reportes:ver", "clientes:ver", "productos:ver"],
      }),
    });

    const { privilegios } = await servicio.privilegiosDeUsuario("u-001");

    assert.deepEqual(privilegios, ["clientes:ver", "productos:ver", "reportes:ver"]);
  });
});

describe("PrivilegiosService.privilegiosDeUsuario", () => {
  it("falla con 404 cuando el usuario no existe", async () => {
    const { servicio } = crearServicio({ usuario: null });

    await assert.rejects(() => servicio.privilegiosDeUsuario("fantasma"), NotFoundException);
  });

  it("a un rol con acceso total le entrega el catálogo completo menos lo revocado", async () => {
    const { servicio } = crearServicio({
      usuario: usuarioFalso({
        rolClave: "ADMINISTRADOR",
        accesoTotal: true,
        revocados: ["productos:eliminar"],
      }),
      catalogo: ["productos:ver", "productos:eliminar", "clientes:ver"],
    });

    const resultado = await servicio.privilegiosDeUsuario("u-001");

    assert.equal(resultado.rol, "ADMINISTRADOR");
    assert.deepEqual(resultado.privilegios, ["clientes:ver", "productos:ver"]);
  });

  it("a un rol sin acceso total no le entrega el catálogo completo", async () => {
    const { servicio } = crearServicio({
      usuario: usuarioFalso({ privilegiosDelRol: ["productos:ver"] }),
      catalogo: ["productos:ver", "productos:eliminar", "clientes:ver"],
    });

    const resultado = await servicio.privilegiosDeUsuario("u-001");

    assert.deepEqual(resultado.privilegios, ["productos:ver"]);
  });
});

describe("PrivilegiosService: caché", () => {
  it("no consulta la base de datos cuando el perfil ya está en caché", async () => {
    const { servicio, registro } = crearServicio({
      cacheado: {
        rol: "VENDEDOR",
        estado: "ACTIVO",
        accesoTotal: false,
        privilegios: ["productos:ver"],
        revocados: [],
      },
    });

    assert.deepEqual(await servicio.verificar("u-001", "productos:ver"), { tiene: true });
    assert.equal(registro.lecturasABaseDeDatos, 0);
  });

  it("guarda el perfil recién calculado con el TTL de un minuto", async () => {
    const { servicio, registro } = crearServicio({
      usuario: usuarioFalso({ privilegiosDelRol: ["productos:ver"] }),
    });

    await servicio.verificar("u-001", "productos:ver");

    assert.deepEqual(registro.clavesEscritas, ["seguridad:privilegios:u-001"]);
    assert.equal(registro.ttlUsado, 60);
  });

  it("invalidar a un usuario borra únicamente su clave", async () => {
    const { servicio, registro } = crearServicio();

    await servicio.invalidarUsuario("u-001");

    assert.deepEqual(registro.clavesEliminadas, ["seguridad:privilegios:u-001"]);
  });

  it("invalidar un rol borra la clave de cada usuario que lo tiene", async () => {
    const { servicio, registro } = crearServicio();

    await servicio.invalidarRol("VENDEDOR");

    assert.deepEqual(registro.clavesEliminadas, [
      "seguridad:privilegios:u-001",
      "seguridad:privilegios:u-002",
    ]);
  });
});
