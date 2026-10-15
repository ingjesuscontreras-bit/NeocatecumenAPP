import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useComunidad } from '../context/ComunidadContext';

export default function InicioScreen() {
  const { salir, comunidad, modo } = useComunidad();

  const handleCerrarSesion = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir? (Esto es solo para pruebas)', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: salir },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>🏠 Inicio</Text>
      <Text style={styles.texto}>
        Comunidad: {comunidad?.nombre || 'Sin nombre'}
      </Text>
      <Text style={styles.texto}>Modo: {modo}</Text>

      <TouchableOpacity style={styles.botonSalir} onPress={handleCerrarSesion}>
        <Text style={styles.botonSalirTexto}>🔧 Cerrar sesión (prueba)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F4FB', alignItems: 'center', justifyContent: 'center', padding: 24 },
  titulo: { fontSize: 26, fontWeight: '800', color: '#221B4D', marginBottom: 10 },
  texto: { fontSize: 16, color: '#6E6693', marginBottom: 4 },
  botonSalir: {
    marginTop: 30,
    backgroundColor: '#D64545',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  botonSalirTexto: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
