"use client";

import AddIcon from "@mui/icons-material/Add";
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
  EstadoChip,
  PRODUCTOS_MOCK,
  PageHeader,
  Permiso,
  type Producto,
  SearchableTable,
  type TipoProducto,
  formatearMoneda,
  usePermisos,
} from "@scipos/frontend-commons";
import { useCallback, useId, useMemo, useState } from "react";

type FiltroEstado = "TODOS" | "ACTIVO" | "INACTIVO";
type FiltroTipo = "TODOS" | TipoProducto;

interface FormularioProducto {
  id?: string;
  clave: string;
  nombre: string;
  tipo: TipoProducto;
  precio: string;
  existencia: string;
  activo: boolean;
}

const FORMULARIO_VACIO: FormularioProducto = {
  clave: "",
  nombre: "",
  tipo: "PRODUCTO",
  precio: "",
  existencia: "",
  activo: true,
};

interface ErroresFormulario {
  clave?: string;
  nombre?: string;
  existencia?: string;
}

function productoAFormulario(producto: Producto): FormularioProducto {
  return {
    id: producto.id,
    clave: producto.clave,
    nombre: producto.nombre,
    tipo: producto.tipo,
    precio: String(producto.precio),
    existencia: String(producto.existencia),
    activo: producto.activo,
  };
}

/**
 * Catálogo de productos y servicios: listar, buscar, filtrar, crear, editar y
 * desactivar (RF-07, RF-08, RF-09). Las acciones se ocultan según el rol mock
 * activo (`usePermisos`) — RF-05.
 */
export function CatalogoProductos() {
  const tituloDialogoId = useId();
  const { can } = usePermisos();

  const [productos, setProductos] = useState<Producto[]>(PRODUCTOS_MOCK);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("TODOS");
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("TODOS");
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [formulario, setFormulario] = useState<FormularioProducto>(FORMULARIO_VACIO);
  const [errores, setErrores] = useState<ErroresFormulario>({});

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

  const guardar = () => {
    const precio = Number(formulario.precio);
    const existencia = Number(formulario.existencia);

    const nuevosErrores: ErroresFormulario = {};
    if (!formulario.clave.trim()) {
      nuevosErrores.clave = "La clave es obligatoria.";
    }
    if (!formulario.nombre.trim()) {
      nuevosErrores.nombre = "El nombre es obligatorio.";
    }
    if (existencia < 0 || existencia > 999) {
      nuevosErrores.existencia = "La existencia debe estar entre 0 y 999.";
    }

    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) {
      return;
    }

    if (formulario.id) {
      setProductos((actuales) =>
        actuales.map((p) =>
          p.id === formulario.id
            ? {
                ...p,
                clave: formulario.clave.trim(),
                nombre: formulario.nombre.trim(),
                tipo: formulario.tipo,
                precio,
                existencia,
                activo: formulario.activo,
              }
            : p,
        ),
      );
    } else {
      setProductos((actuales) => [
        ...actuales,
        {
          id: `p-${Date.now()}`,
          clave: formulario.clave.trim(),
          nombre: formulario.nombre.trim(),
          tipo: formulario.tipo,
          precio,
          existencia,
          activo: formulario.activo,
        },
      ]);
    }
    setDialogoAbierto(false);
  };

  const alternarActivo = useCallback((producto: Producto) => {
    setProductos((actuales) =>
      actuales.map((p) => (p.id === producto.id ? { ...p, activo: !p.activo } : p)),
    );
  }, []);

  const columnas = useMemo<Columna<Producto>[]>(() => {
    const base: Columna<Producto>[] = [
      { clave: "clave", titulo: "Clave", render: (p) => p.clave },
      { clave: "nombre", titulo: "Nombre", render: (p) => p.nombre },
      {
        clave: "tipo",
        titulo: "Tipo",
        render: (p) => (p.tipo === "PRODUCTO" ? "Producto" : "Servicio"),
      },
      {
        clave: "precio",
        titulo: "Precio",
        align: "right",
        render: (p) => formatearMoneda(p.precio),
      },
      { clave: "existencia", titulo: "Existencia", align: "right", render: (p) => p.existencia },
      { clave: "estado", titulo: "Estado", render: (p) => <EstadoChip activo={p.activo} /> },
    ];

    if (!can("productos:editar") && !can("productos:desactivar")) return base;

    return [
      ...base,
      {
        clave: "acciones",
        titulo: "Acciones",
        align: "right",
        render: (p) => (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Permiso requiere="productos:editar">
              <Tooltip title="Editar">
                <IconButton size="small" onClick={() => abrirEditar(p)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Permiso>
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
          </Stack>
        ),
      },
    ];
  }, [can, abrirEditar, alternarActivo]);

  return (
    <Box>
      <PageHeader
        titulo="Catálogo"
        descripcion="Productos y servicios"
        acciones={
          <Permiso requiere="productos:crear">
            <Button variant="contained" startIcon={<AddIcon />} onClick={abrirCrear}>
              Nuevo producto
            </Button>
          </Permiso>
        }
      />

      <SearchableTable
        filas={productosFiltrados}
        columnas={columnas}
        textoBusqueda={(p) => `${p.clave} ${p.nombre}`}
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

      <Dialog open={dialogoAbierto} onClose={cerrarDialogo} fullWidth maxWidth="sm">
        <DialogTitle id={tituloDialogoId}>
          {formulario.id ? "Editar producto" : "Nuevo producto"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Clave"
              value={formulario.clave}
              onChange={(e) => setFormulario((f) => ({ ...f, clave: e.target.value }))}
              error={Boolean(errores.clave)}
              helperText={errores.clave}
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
              label="Precio"
              type="number"
              value={formulario.precio}
              onChange={(e) => setFormulario((f) => ({ ...f, precio: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Existencia"
              type="number"
              value={formulario.existencia}
              onChange={(e) => setFormulario((f) => ({ ...f, existencia: e.target.value }))}
              error={Boolean(errores.existencia)}
              helperText={errores.existencia}
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
