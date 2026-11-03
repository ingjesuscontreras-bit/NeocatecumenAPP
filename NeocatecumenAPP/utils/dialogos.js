import { Alert, Platform } from 'react-native';

// En la web, Alert de React Native no muestra nada: ahí usamos las ventanas del navegador.

export function avisar(titulo, mensaje = '') {
  if (Platform.OS === 'web') {
    window.alert(mensaje ? `${titulo}\n\n${mensaje}` : titulo);
    return;
  }
  Alert.alert(titulo, mensaje);
}

// Devuelve una promesa: true si la persona confirma, false si cancela
export function confirmar(titulo, mensaje, textoSi = 'Sí', destructivo = false) {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${titulo}\n\n${mensaje}`));
  return new Promise((resolve) => {
    Alert.alert(
      titulo,
      mensaje,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: textoSi, style: destructivo ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}
