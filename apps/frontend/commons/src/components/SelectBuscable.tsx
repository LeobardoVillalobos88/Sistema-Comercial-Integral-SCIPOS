"use client";

import SearchIcon from "@mui/icons-material/Search";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";

export interface SelectBuscableProps<T> {
  etiqueta?: string;
  opciones: readonly T[];
  valor: T | null;
  onCambio: (valor: T | null) => void;
  obtenerEtiqueta: (opcion: T) => string;
  obtenerClave?: (opcion: T) => string;
  placeholder?: string;
  cargando?: boolean;
  deshabilitado?: boolean;
  requerido?: boolean;
  tamano?: "small" | "medium";
  permitirVacio?: boolean;
  sinResultados?: string;
  error?: boolean;
  textoAyuda?: string;
}

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
