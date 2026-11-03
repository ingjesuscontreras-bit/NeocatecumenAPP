import { Platform, useWindowDimensions } from 'react-native';

// A partir de este ancho (en la web) se usa el diseño de computadora
export const ANCHO_COMPUTADORA = 900;

// true solo en la web y en pantallas anchas (computadora o tableta grande)
export function usePantallaAncha() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= ANCHO_COMPUTADORA;
}
