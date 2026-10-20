/**
 * theme/layout.js
 * -----------------------------------------------------------------------
 * Medidas y estilos reutilizables de toda la app: espaciados, tamaños
 * de texto, radios de borde y sombra de tarjetas.
 * -----------------------------------------------------------------------
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const RADIUS = {
  sm: 10,
  md: 16,
  lg: 20,
};

export const FONT = {
  titulo: 28,
  subtitulo: 17,
  texto: 16,
  pequeno: 14,
};

// Sombra sutil para tarjetas — se "esparce" en iOS/Android distinto,
// por eso trae ambas propiedades.
export const SOMBRA_TARJETA = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3, // Android usa esto en vez de shadow*
};
