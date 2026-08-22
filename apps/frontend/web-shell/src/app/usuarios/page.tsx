"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  type Columna,
  ETIQUETAS_ROL,
  ErrorApi,
  PageHeader,
  type Rol,
  SearchableTable,
  SkeletonTabla,
  type UsuarioSesion,
  llamarApi,
  usePermisos,
} from "@scipos/frontend-commons";
import { confirmar, useToast } from "@scipos/frontend-commons/feedback";
import { useCallback, useEffect, useState } from "react";

const ROLES: Rol[] = ["ADMINISTRADOR", "VENDEDOR", "CAJERO", "SUPERVISOR"];

interface FormularioUsuario {
  id: string | null;
  nombre: string;
  correo: string;
  rol: Rol;
  contrasena: string;
}

const FORMULARIO_VACIO: FormularioUsuario = {
  id: null,
  nombre: "",
  correo: "",
  rol: "VENDEDOR",
  contrasena: "",
};

function mensajeError(error: unknown, mensajePorDefecto: string): string {
  return error instanceof ErrorApi ? error.message : mensajePorDefecto;
}

export default function UsuariosPage() {
  const { can, usuario: usuarioActivo, cargandoPermisos } = usePermisos();
  const toast = useToast();
  const tema = useTheme();
  const esMovil = useMediaQuery(tema.breakpoints.down("sm"));

  const [usuarios, setUsuarios] = useState<UsuarioSesion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [formulario, setFormulario] = useState<FormularioUsuario>(FORMULARIO_VACIO);
  const [guardando, setGuardando] = useState(false);

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    try {
      setUsuarios(await llamarApi<UsuarioSesion[]>("/seguridad/usuarios"));
    } catch (error) {
      toast.error(mensajeError(error, "No se pudo cargar la lista de usuarios."));
    } finally {
      setCargando(false);
    }
  }, [toast]);

  useEffect(() => {
    if (cargandoPermisos || !usuarioActivo || !can("seguridad:ver")) {
      return;
    }
    cargarUsuarios();
  }, [cargandoPermisos, usuarioActivo, can, cargarUsuarios]);

  const abrirCrear = () => {
    setFormulario(FORMULARIO_VACIO);
    setDialogoAbierto(true);
  };

  const abrirEditar = (usuario: UsuarioSesion) => {
    setFormulario({
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
      contrasena: "",
    });
    setDialogoAbierto(true);
  };

  const guardar = async () => {
    if (!formulario.nombre.trim() || !formulario.correo.trim()) {
      toast.error("El nombre y el correo son obligatorios.");
      return;
    }
    if (!formulario.id && formulario.contrasena.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setGuardando(true);
    try {
      if (formulario.id) {
        const datos: Record<string, string> = {
          nombre: formulario.nombre.trim(),
          correo: formulario.correo.trim(),
          rol: formulario.rol,
        };
        if (formulario.contrasena) {
          datos.contrasena = formulario.contrasena;
        }
        const actualizado = await llamarApi<UsuarioSesion>(`/seguridad/usuarios/${formulario.id}`, {
          method: "PATCH",
          body: JSON.stringify(datos),
        });
        setUsuarios((actuales) => actuales.map((u) => (u.id === actualizado.id ? actualizado : u)));
        toast.exito("Usuario actualizado correctamente.");
      } else {
        const creado = await llamarApi<UsuarioSesion>("/seguridad/usuarios", {
          method: "POST",
          body: JSON.stringify({
            nombre: formulario.nombre.trim(),
            correo: formulario.correo.trim(),
            rol: formulario.rol,
            contrasena: formulario.contrasena,
          }),
        });
        setUsuarios((actuales) => [...actuales, creado]);
        toast.exito("Usuario creado. Ya puede iniciar sesión.");
      }
      setDialogoAbierto(false);
    } catch (error) {
      toast.error(mensajeError(error, "No se pudo guardar el usuario."));
    } finally {
      setGuardando(false);
    }
  };

  const alternarEstado = useCallback(
    async (usuario: UsuarioSesion) => {
      const nuevoEstado = usuario.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
      if (nuevoEstado === "INACTIVO") {
        const confirmado = await confirmar({
          titulo: "¿Desactivar usuario?",
          texto: `"${usuario.nombre}" (${usuario.correo}) no podrá iniciar sesión mientras esté inactivo.`,
          confirmar: "Sí, desactivar",
        });
        if (!confirmado) {
          return;
        }
      }
      try {
        const actualizado = await llamarApi<UsuarioSesion>(`/seguridad/usuarios/${usuario.id}`, {
          method: "PATCH",
          body: JSON.stringify({ estado: nuevoEstado }),
        });
        setUsuarios((actuales) => actuales.map((u) => (u.id === actualizado.id ? actualizado : u)));
        toast.info(nuevoEstado === "ACTIVO" ? "Usuario activado." : "Usuario desactivado.");
      } catch (error) {
        toast.error(mensajeError(error, "No se pudo cambiar el estado del usuario."));
      }
    },
    [toast],
  );

  const eliminar = useCallback(
    async (usuario: UsuarioSesion) => {
      const confirmado = await confirmar({
        titulo: "¿Eliminar usuario?",
        texto: `"${usuario.nombre}" (${usuario.correo}) perderá el acceso definitivamente.`,
        confirmar: "Sí, eliminar",
      });
      if (!confirmado) {
        return;
      }
      try {
        await llamarApi(`/seguridad/usuarios/${usuario.id}`, { method: "DELETE" });
        setUsuarios((actuales) => actuales.filter((u) => u.id !== usuario.id));
        toast.info("Usuario eliminado.");
      } catch (error) {
        toast.error(mensajeError(error, "No se pudo eliminar el usuario."));
      }
    },
    [toast],
  );

  if (!cargandoPermisos && !can("seguridad:ver")) {
    return (
      <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
        <Alert severity="warning">
          No tienes privilegios para administrar usuarios con el rol actual.
        </Alert>
      </Container>
    );
  }

  const columnas: Columna<UsuarioSesion>[] = [
    { clave: "nombre", titulo: "Nombre", render: (u) => u.nombre },
    { clave: "correo", titulo: "Correo", render: (u) => u.correo },
    { clave: "rol", titulo: "Rol", render: (u) => ETIQUETAS_ROL[u.rol] },
    {
      clave: "estado",
      titulo: "Estado",
      render: (u) => (
        <Chip
          size="small"
          color={u.estado === "ACTIVO" ? "success" : "default"}
          label={u.estado === "ACTIVO" ? "Activo" : "Inactivo"}
        />
      ),
    },
    {
      clave: "acciones",
      titulo: "Acciones",
      align: "right",
      render: (u) => {
        const esUsuarioActivo = u.id === usuarioActivo?.id;
        return (
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            <Tooltip title={u.estado === "ACTIVO" ? "Desactivar" : "Activar"}>
              <span>
                <IconButton
                  size="small"
                  color="success"
                  disabled={esUsuarioActivo}
                  onClick={() => alternarEstado(u)}
                  aria-label={`Cambiar estado de ${u.nombre}`}
                >
                  <ToggleOnIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Editar">
              <IconButton
                size="small"
                color="info"
                onClick={() => abrirEditar(u)}
                aria-label={`Editar a ${u.nombre}`}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={esUsuarioActivo ? "No puedes eliminar tu propio usuario" : "Eliminar"}>
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={esUsuarioActivo}
                  onClick={() => eliminar(u)}
                  aria-label={`Eliminar a ${u.nombre}`}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        );
      },
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
      <PageHeader
        titulo="Usuarios"
        descripcion="Administra las cuentas del sistema: rol, estado, contraseña y acceso."
        acciones={
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirCrear}>
            Nuevo usuario
          </Button>
        }
      />

      {cargando || cargandoPermisos ? (
        <SkeletonTabla columnas={5} />
      ) : (
        <SearchableTable
          filas={usuarios}
          columnas={columnas}
          claveFila={(u) => u.id}
          textoBusqueda={(u) => `${u.nombre} ${u.correo} ${u.rol}`}
          placeholderBusqueda="Buscar por nombre, correo o rol..."
          mensajeVacio="No hay usuarios que coincidan con la búsqueda."
        />
      )}

      <Dialog
        open={dialogoAbierto}
        onClose={() => setDialogoAbierto(false)}
        fullWidth
        maxWidth="sm"
        fullScreen={esMovil}
      >
        <DialogTitle>{formulario.id ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre completo"
              value={formulario.nombre}
              onChange={(e) => setFormulario((f) => ({ ...f, nombre: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Correo"
              type="email"
              value={formulario.correo}
              onChange={(e) => setFormulario((f) => ({ ...f, correo: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              select
              label="Rol"
              value={formulario.rol}
              onChange={(e) => setFormulario((f) => ({ ...f, rol: e.target.value as Rol }))}
              fullWidth
            >
              {ROLES.map((rol) => (
                <MenuItem key={rol} value={rol}>
                  {ETIQUETAS_ROL[rol]}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={formulario.id ? "Nueva contraseña (opcional)" : "Contraseña"}
              type="password"
              value={formulario.contrasena}
              onChange={(e) => setFormulario((f) => ({ ...f, contrasena: e.target.value }))}
              helperText="Mínimo 8 caracteres."
              fullWidth
              required={!formulario.id}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoAbierto(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardar} disabled={guardando}>
            {formulario.id ? "Guardar cambios" : "Crear usuario"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
