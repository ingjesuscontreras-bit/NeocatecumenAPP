import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS, FONT, SOMBRA_TARJETA } from '../theme/layout';

export default function BienvenidaScreen({ onElegirAdmin, onElegirMiembro }) {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>🙏 NeocatecumenAPP</Text>
      <Text style={styles.subtitulo}>¿Cómo quieres entrar?</Text>

      <TouchableOpacity style={styles.opcion} onPress={onElegirMiembro} activeOpacity={0.8}>
        <Ionicons name="people" size={34} color={COLORS.primary} />
        <View style={{ flex: 1, marginLeft: SPACING.md - 2 }}>
          <Text style={styles.opcionTitulo}>Tengo un código de mi comunidad</Text>
          <Text style={styles.opcionTexto}>Entra con el código que te dio tu responsable</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.opcionAdmin} onPress={onElegirAdmin} activeOpacity={0.8}>
        <Ionicons name="shield-checkmark" size={34} color="#FFFFFF" />
        <View style={{ flex: 1, marginLeft: SPACING.md - 2 }}>
          <Text style={styles.opcionAdminTitulo}>Soy el Responsable</Text>
          <Text style={styles.opcionAdminTexto}>Administrar mi comunidad</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  titulo: {
    fontSize: FONT.titulo + 2,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs + 2,
  },
  subtitulo: {
    fontSize: FONT.subtitulo,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.xl - 2,
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.lg - 4,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SOMBRA_TARJETA,
  },
  opcionTitulo: { fontSize: FONT.subtitulo, fontWeight: '700', color: COLORS.text },
  opcionTexto: { fontSize: FONT.pequeno, color: COLORS.textMuted, marginTop: 2 },
  opcionAdmin: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: SPACING.lg - 4,
    ...SOMBRA_TARJETA,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
  },
  opcionAdminTitulo: { fontSize: FONT.subtitulo, fontWeight: '700', color: '#FFFFFF' },
  opcionAdminTexto: { fontSize: FONT.pequeno, color: '#D9D3F5', marginTop: 2 },
});