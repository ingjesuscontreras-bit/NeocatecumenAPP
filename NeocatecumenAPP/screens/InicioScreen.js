import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useComunidad } from '../context/ComunidadContext';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS, FONT } from '../theme/layout';

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
      <Text style={styles.texto}>Comunidad: {comunidad?.nombre || 'Sin nombre'}</Text>
      <Text style={styles.texto}>Modo: {modo}</Text>

      <TouchableOpacity style={styles.botonSalir} onPress={handleCerrarSesion}>
        <Text style={styles.botonSalirTexto}>🔧 Cerrar sesión (prueba)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  titulo: { fontSize: FONT.titulo - 2, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.sm + 2 },
  texto: { fontSize: FONT.texto, color: COLORS.textMuted, marginBottom: SPACING.xs },
  botonSalir: {
    marginTop: SPACING.xl - 2,
    backgroundColor: COLORS.danger,
    borderRadius: RADIUS.sm + 4,
    paddingVertical: SPACING.md - 2,
    paddingHorizontal: SPACING.lg,
  },
  botonSalirTexto: { color: '#FFFFFF', fontSize: FONT.pequeno + 1, fontWeight: '700' },
});