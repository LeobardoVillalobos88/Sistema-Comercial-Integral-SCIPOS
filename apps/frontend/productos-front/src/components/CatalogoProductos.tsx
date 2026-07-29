"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import {
  type Columna,
  ErrorApi,
  EstadoChip,
  PageHeader,
  Permiso,
  type Producto,
  SearchableTable,
  SkeletonTabla,
  type TipoProducto,
  formatearFecha,
  formatearMoneda,
  llamarApi,
  usePermisos,
} from "@scipos/frontend-commons";
import { confirmar, useToast } from "@scipos/frontend-commons/feedback";
import { useCallback, useEffect, useId, useMemo, useState } from "react";

type FiltroEstado = "TODOS" | "ACTIVO" | "INACTIVO";
type FiltroTipo = "TODOS" | TipoProducto;

interface FormularioProducto {
  id?: string;
  lote: string;
  nombre: string;
  tipo: TipoProducto;
  precioCompra: string;
  precioVenta: string;
  existencia: string;
  fechaCaducidad: string;
  activo: boolean;
}

const FORMULARIO_VACIO: FormularioProducto = {
  lote: "",
  nombre: "",
  tipo: "PRODUCTO",
  precioCompra: "",
  precioVenta: "",
  existencia: "",
  fechaCaducidad: "",
  activo: true,
};

interface ErroresFormulario {
  lote?: string;
  nombre?: string;
  precioCompra?: string;
  precioVenta?: string;
  existencia?: string;
}

function productoAFormulario(producto: Producto): FormularioProducto {
  return {
    id: producto.id,
    lote: producto.lote,
    nombre: producto.nombre,
    tipo: producto.tipo,
    precioCompra: String(producto.precioCompra),
    precioVenta: String(producto.precioVenta),
    existencia: String(producto.existencia),
    fechaCaducidad: producto.fechaCaducidad ?? "",
    activo: producto.activo,
  };
}

/** Mensaje del backend si la API lo dio, o un mensaje genérico si fue un error de red u otro. */
function mensajeError(error: unknown, mensajePorDefecto: string): string {
  return error instanceof ErrorApi ? error.message : mensajePorDefecto;
}

/**
 * Catálogo de productos y servicios: listar, buscar, filtrar, crear, editar,
 * desactivar y eliminar (RF-07, RF-08, RF-09) contra la API real del
 * servicio de productos. Las acciones se ocultan según los privilegios del
 * usuario activo (`usePermisos`) — RF-05/RF-06.
 */
export function CatalogoProductos() {
  const tituloDialogoId = useId();
  const { can, usuario, cargandoPermisos } = usePermisos();
  const toast = useToast();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("TODOS");
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("TODOS");
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [formulario, setFormulario] = useState<FormularioProducto>(FORMULARIO_VACIO);
  const [errores, setErrores] = useState<ErroresFormulario>({});

  const cargarProductos = useCallback(async () => {
    setCargando(true);
    try {
      const lista = await llamarApi<Producto[]>("/productos/productos");
      setProductos(lista);
    } catch (error) {
      toast.error(mensajeError(error, "No se pudo cargar el catálogo de productos."));
    } finally {
      setCargando(false);
    }
  }, [toast]);

  // Espera a que PermisosProvider resuelva el usuario activo (y por lo tanto
  // el header x-usuario-id) antes de pedir el catálogo; si se dispara antes,
  // el backend responde 401 y el catálogo queda vacío.
  useEffect(() => {
    if (cargandoPermisos || !usuario) {
      return;
    }
    cargarProductos();
  }, [cargandoPermisos, usuario, cargarProductos]);

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const coincideEstado =
        filtroEstado === "TODOS" || (filtroEstado === "ACTIVO" ? p.activo : !p.activo);
      const coincideTipo = filtroTipo === "TODOS" || p.tipo === filtroTipo;
      return coincideEstado && coincideTipo;
    });
  }, [productos, filtroEstado, filtroTipo]);

  const abrirCrear = () => {
    setFormulario(FORMULARIO_VACIO);
    setErrores({});
    setDialogoAbierto(true);
  };

  const abrirEditar = useCallback((producto: Producto) => {
    setFormulario(productoAFormulario(producto));
    setErrores({});
    setDialogoAbierto(true);
  }, []);

  const cerrarDialogo = () => setDialogoAbierto(false);

  const guardar = async () => {
    const precioCompra = Number(formulario.precioCompra);
    const precioVenta = Number(formulario.precioVenta);
    const existencia = Number(formulario.existencia);

    const nuevosErrores: ErroresFormulario = {};
    if (!formulario.lote.trim()) {
      nuevosErrores.lote = "El lote es obligatorio.";
    }
    if (!formulario.nombre.trim()) {
      nuevosErrores.nombre = "El nombre es obligatorio.";
    }
    if (Number.isNaN(precioCompra) || precioCompra < 0) {
      nuevosErrores.precioCompra = "El precio de compra no puede ser negativo.";
    }
    if (Number.isNaN(precioVenta) || precioVenta <= 0) {
      nuevosErrores.precioVenta = "El precio de venta debe ser mayor a 0.";
    }
    if (Number.isNaN(existencia) || existencia < 0 || existencia > 999) {
      nuevosErrores.existencia = "La existencia debe estar entre 0 y 999.";
    }

    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) {
      return;
    }

    const datos = {
      lote: formulario.lote.trim(),
      nombre: formulario.nombre.trim(),
      tipo: formulario.tipo,
      precioCompra,
      precioVenta,
      existencia,
      fechaCaducidad: formulario.fechaCaducidad || undefined,
    };

    try {
      if (formulario.id) {
        let productoFinal = await llamarApi<Producto>(`/productos/productos/${formulario.id}`, {
          method: "PATCH",
          body: JSON.stringify(datos),
        });
        const original = productos.find((p) => p.id === formulario.id);
        if (original && original.activo !== formulario.activo) {
          productoFinal = await llamarApi<Producto>(
            `/productos/productos/${formulario.id}/estado`,
            {
              method: "PATCH",
              body: JSON.stringify({ activo: formulario.activo }),
            },
          );
        }
        setProductos((actuales) =>
          actuales.map((p) => (p.id === productoFinal.id ? productoFinal : p)),
        );
        toast.exito("Producto actualizado correctamente.");
      } else {
        const creado = await llamarApi<Producto>("/productos/productos", {
          method: "POST",
          body: JSON.stringify(datos),
        });
        setProductos((actuales) => [...actuales, creado]);
        toast.exito("Producto creado.");
      }
      setDialogoAbierto(false);
    } catch (error) {
      toast.error(mensajeError(error, "No se pudo guardar el producto."));
    }
  };

  const alternarActivo = useCallback(
    async (producto: Producto) => {
      if (producto.activo) {
        const confirmado = await confirmar({
          titulo: "¿Desactivar producto?",
          texto: `"${producto.nombre}" dejará de estar disponible en el catálogo.`,
          confirmar: "Sí, desactivar",
        });
        if (!confirmado) {
          return;
        }
      }
      try {
        const actualizado = await llamarApi<Producto>(
          `/productos/productos/${producto.id}/estado`,
          {
            method: "PATCH",
            body: JSON.stringify({ activo: !producto.activo }),
          },
        );
        setProductos((actuales) =>
          actuales.map((p) => (p.id === actualizado.id ? actualizado : p)),
        );
        toast.info(producto.activo ? "Producto desactivado." : "Producto activado.");
      } catch (error) {
        toast.error(mensajeError(error, "No se pudo cambiar el estado del producto."));
      }
    },
    [toast],
  );

  const eliminarProducto = useCallback(
    async (producto: Producto) => {
      const confirmado = await confirmar({
        titulo: "¿Eliminar producto?",
        texto: `"${producto.nombre}" se eliminará permanentemente del catálogo.`,
        confirmar: "Sí, eliminar",
      });
      if (!confirmado) {
        return;
      }
      try {
        await llamarApi(`/productos/productos/${producto.id}`, { method: "DELETE" });
        setProductos((actuales) => actuales.filter((p) => p.id !== producto.id));
        toast.info("Producto eliminado.");
      } catch (error) {
        toast.error(mensajeError(error, "No se pudo eliminar el producto."));
      }
    },
    [toast],
  );

  const columnas = useMemo<Columna<Producto>[]>(() => {
    const base: Columna<Producto>[] = [
      { clave: "lote", titulo: "Lote", render: (p) => p.lote },
      { clave: "nombre", titulo: "Nombre", render: (p) => p.nombre },
      {
        clave: "tipo",
        titulo: "Tipo",
        render: (p) => (p.tipo === "PRODUCTO" ? "Producto" : "Servicio"),
      },
      {
        clave: "precioCompra",
        titulo: "P. compra",
        align: "right",
        render: (p) => formatearMoneda(p.precioCompra),
      },
      {
        clave: "precioVenta",
        titulo: "P. venta",
        align: "right",
        render: (p) => formatearMoneda(p.precioVenta),
      },
      { clave: "existencia", titulo: "Existencia", align: "right", render: (p) => p.existencia },
      {
        clave: "fechaCaducidad",
        titulo: "Caducidad",
        render: (p) => (p.fechaCaducidad ? formatearFecha(p.fechaCaducidad) : "—"),
      },
      { clave: "estado", titulo: "Estado", render: (p) => <EstadoChip activo={p.activo} /> },
    ];

    if (!can("productos:editar") && !can("productos:desactivar") && !can("productos:eliminar")) {
      return base;
    }

    return [
      ...base,
      {
        clave: "acciones",
        titulo: "Acciones",
        align: "right",
        render: (p) => (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Permiso requiere="productos:desactivar">
              <Tooltip title={p.activo ? "Desactivar" : "Activar"}>
                <IconButton size="small" onClick={() => alternarActivo(p)}>
                  {p.activo ? (
                    <ToggleOnIcon fontSize="small" color="success" />
                  ) : (
                    <ToggleOffIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            </Permiso>
            <Permiso requiere="productos:editar">
              <Tooltip title="Editar">
                <IconButton size="small" color="info" onClick={() => abrirEditar(p)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Permiso>
            <Permiso requiere="productos:eliminar">
              <Tooltip title="Eliminar">
                <IconButton size="small" color="error" onClick={() => eliminarProducto(p)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Permiso>
          </Stack>
        ),
      },
    ];
  }, [can, abrirEditar, alternarActivo, eliminarProducto]);

  return (
    <Box>
      <PageHeader
        titulo="Productos"
        descripcion="Catálogo de productos y servicios"
        acciones={
          <Permiso requiere="productos:crear">
            <Button variant="contained" startIcon={<AddIcon />} onClick={abrirCrear}>
              Nuevo producto
            </Button>
          </Permiso>
        }
      />

      {cargando ? (
        <SkeletonTabla columnas={8} />
      ) : (
        <SearchableTable
          filas={productosFiltrados}
          columnas={columnas}
          claveFila={(p) => p.id}
          textoBusqueda={(p) => `${p.lote} ${p.nombre}`}
          placeholderBusqueda="Buscar producto o servicio..."
          mensajeVacio="No hay productos que coincidan con la búsqueda y los filtros."
          filtros={
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select
                label="Estado"
                size="small"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="TODOS">Todos</MenuItem>
                <MenuItem value="ACTIVO">Activo</MenuItem>
                <MenuItem value="INACTIVO">Inactivo</MenuItem>
              </TextField>
              <TextField
                select
                label="Tipo"
                size="small"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as FiltroTipo)}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="TODOS">Todos</MenuItem>
                <MenuItem value="PRODUCTO">Producto</MenuItem>
                <MenuItem value="SERVICIO">Servicio</MenuItem>
              </TextField>
            </Stack>
          }
        />
      )}

      <Dialog open={dialogoAbierto} onClose={cerrarDialogo} fullWidth maxWidth="sm">
        <DialogTitle id={tituloDialogoId}>
          {formulario.id ? "Editar producto" : "Nuevo producto"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Lote"
              value={formulario.lote}
              onChange={(e) => setFormulario((f) => ({ ...f, lote: e.target.value }))}
              error={Boolean(errores.lote)}
              helperText={errores.lote}
              fullWidth
            />
            <TextField
              label="Nombre"
              value={formulario.nombre}
              onChange={(e) => setFormulario((f) => ({ ...f, nombre: e.target.value }))}
              error={Boolean(errores.nombre)}
              helperText={errores.nombre}
              fullWidth
            />
            <TextField
              select
              label="Tipo"
              value={formulario.tipo}
              onChange={(e) =>
                setFormulario((f) => ({ ...f, tipo: e.target.value as TipoProducto }))
              }
              fullWidth
            >
              <MenuItem value="PRODUCTO">Producto</MenuItem>
              <MenuItem value="SERVICIO">Servicio</MenuItem>
            </TextField>
            <TextField
              label="Precio de compra"
              type="number"
              slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
              value={formulario.precioCompra}
              onChange={(e) =>
                setFormulario((f) => ({
                  ...f,
                  precioCompra: e.target.value.replace(/[^\d.]/g, ""),
                }))
              }
              error={Boolean(errores.precioCompra)}
              helperText={errores.precioCompra}
              fullWidth
            />
            <TextField
              label="Precio de venta"
              type="number"
              slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
              value={formulario.precioVenta}
              onChange={(e) =>
                setFormulario((f) => ({
                  ...f,
                  precioVenta: e.target.value.replace(/[^\d.]/g, ""),
                }))
              }
              error={Boolean(errores.precioVenta)}
              helperText={errores.precioVenta}
              fullWidth
            />
            <TextField
              label="Existencia"
              type="number"
              value={formulario.existencia}
              onChange={(e) =>
                setFormulario((f) => ({
                  ...f,
                  existencia: e.target.value.replace(/\D/g, "").slice(0, 3),
                }))
              }
              error={Boolean(errores.existencia)}
              helperText={errores.existencia}
              fullWidth
            />
            <TextField
              label="Fecha de caducidad"
              type="date"
              value={formulario.fechaCaducidad}
              onChange={(e) => setFormulario((f) => ({ ...f, fechaCaducidad: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField
              select
              label="Estado"
              value={formulario.activo ? "ACTIVO" : "INACTIVO"}
              onChange={(e) =>
                setFormulario((f) => ({ ...f, activo: e.target.value === "ACTIVO" }))
              }
              fullWidth
            >
              <MenuItem value="ACTIVO">Activo</MenuItem>
              <MenuItem value="INACTIVO">Inactivo</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>Cancelar</Button>
          <Button variant="contained" onClick={guardar}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
