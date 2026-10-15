import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#4C3AAE',
  accent: '#FF7A45',
  background: '#F5F4FB',
  card: '#FFFFFF',
  border: '#DAD6F2',
  text: '#221B4D',
  textMuted: '#6E6693',
};

export default function BienvenidaScreen({ onElegirAdmin, onElegirMiembro }) {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>🙏 NeocatecumenAPP</Text>
      <Text style={styles.subtitulo}>¿Cómo quieres entrar?</Text>

      <TouchableOpacity style={styles.opcion} onPress={onElegirMiembro} activeOpacity={0.8}>
        <Ionicons name="people" size={34} color={COLORS.primary} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.opcionTitulo}>Tengo un código de mi comunidad</Text>
          <Text style={styles.opcionTexto}>Entra con el código que te dio tu responsable</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.opcionAdmin} onPress={onElegirAdmin} activeOpacity={0.8}>
        <Ionicons name="shield-checkmark" size={34} color="#FFFFFF" />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.opcionAdminTitulo}>Soy el Responsable</Text>
          <Text style={styles.opcionAdminTexto}>Administrar mi comunidad</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 24, justifyContent: 'center' },
  titulo: { fontSize: 30, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 6 },
  subtitulo: { fontSize: 16, color: COLORS.textMuted, textAlign: 'center', marginBottom: 30 },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  opcionTitulo: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  opcionTexto: { fontSize: 14, color: COLORS.textMuted, marginTop: 2 },
  opcionAdmin: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
  },
  opcionAdminTitulo: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  opcionAdminTexto: { fontSize: 14, color: '#D9D3F5', marginTop: 2 },
});
