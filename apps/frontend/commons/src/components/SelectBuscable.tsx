"use client";

import SearchIcon from "@mui/icons-material/Search";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";

export interface SelectBuscableProps<T> {
  /** Rótulo del campo. */
  etiqueta?: string;
  opciones: readonly T[];
  valor: T | null;
  onCambio: (valor: T | null) => void;
  /** Texto con el que se muestra y se busca cada opción. */
  obtenerEtiqueta: (opcion: T) => string;
  /**
   * Identificador estable de la opción. Se usa para reconocer el valor
   * seleccionado cuando la lista se vuelve a pedir a la API y llega en objetos
   * nuevos: sin esto, comparar por identidad dejaría el campo en blanco.
   */
  obtenerClave?: (opcion: T) => string;
  placeholder?: string;
  cargando?: boolean;
  deshabilitado?: boolean;
  requerido?: boolean;
  tamano?: "small" | "medium";
  /** Permite vaciar el campo. Activo por omisión. */
  permitirVacio?: boolean;
  /** Texto cuando ninguna opción coincide con lo escrito. */
  sinResultados?: string;
  error?: boolean;
  textoAyuda?: string;
}

/**
 * Campo de selección con búsqueda. Reemplaza a la lista desplegable cuando el
 * catálogo puede crecer: con cien productos, deslizar deja de ser una forma de
 * encontrar algo.
 *
 * Lleva lupa en lugar de la flecha del desplegable, para que se vea de entrada
 * que además de elegir se puede escribir.
 *
 * Ejemplo:
 *   <SelectBuscable
 *     etiqueta="Cliente"
 *     opciones={clientes}
 *     valor={cliente}
 *     onCambio={setCliente}
 *     obtenerEtiqueta={(c) => c.nombre}
 *   />
 */
export function SelectBuscable<T>({
  etiqueta,
  opciones,
  valor,
  onCambio,
  obtenerEtiqueta,
  obtenerClave,
  placeholder = "Escribe para buscar…",
  cargando = false,
  deshabilitado = false,
  requerido = false,
  tamano = "medium",
  permitirVacio = true,
  sinResultados = "Nada coincide con lo que escribiste.",
  error = false,
  textoAyuda,
}: SelectBuscableProps<T>) {
  return (
    <Autocomplete
      options={opciones}
      value={valor}
      onChange={(_, seleccion) => onCambio(seleccion)}
      getOptionLabel={obtenerEtiqueta}
      isOptionEqualToValue={
        obtenerClave
          ? (opcion, elegida) => obtenerClave(opcion) === obtenerClave(elegida)
          : undefined
      }
      loading={cargando}
      disabled={deshabilitado}
      size={tamano}
      fullWidth
      disableClearable={!permitirVacio}
      noOptionsText={sinResultados}
      loadingText="Cargando…"
      popupIcon={<SearchIcon fontSize="small" />}
      // La lupa no es una flecha: no debe girar al abrirse la lista.
      sx={{ "& .MuiAutocomplete-popupIndicator": { transform: "none" } }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={etiqueta}
          placeholder={placeholder}
          required={requerido}
          error={error}
          helperText={textoAyuda}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {cargando ? <CircularProgress size={16} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
}
