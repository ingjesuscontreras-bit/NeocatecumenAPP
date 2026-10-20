import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { liturgiaHoy } from '../data/liturgia';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS, FONT, SOMBRA_TARJETA } from '../theme/layout';

export default function LiturgiaScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.titulo}>✝️ Liturgia</Text>
      <Text style={styles.fecha}>{liturgiaHoy.fecha}</Text>
      <View style={styles.badgeTiempo}>
        <Text style={styles.badgeTiempoTexto}>{liturgiaHoy.tiempoLiturgico}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="book-outline" size={22} color={COLORS.primary} />
          <Text style={styles.cardTitulo}>Primera Lectura</Text>
        </View>
        <Text style={styles.referencia}>{liturgiaHoy.primeraLectura.referencia}</Text>
        <Text style={styles.resumen}>{liturgiaHoy.primeraLectura.resumen}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="musical-notes-outline" size={22} color={COLORS.primary} />
          <Text style={styles.cardTitulo}>Salmo Responsorial</Text>
        </View>
        <Text style={styles.referencia}>{liturgiaHoy.salmo.referencia}</Text>
        <Text style={styles.resumen}>"{liturgiaHoy.salmo.estribillo}"</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="star-outline" size={22} color={COLORS.primary} />
          <Text style={styles.cardTitulo}>Evangelio</Text>
        </View>
        <Text style={styles.referencia}>{liturgiaHoy.evangelio.referencia}</Text>
        <Text style={styles.resumen}>{liturgiaHoy.evangelio.resumen}</Text>
      </View>

      <Text style={styles.tituloSeccion}>🎵 Cantos de la celebración</Text>
      {liturgiaHoy.cantos.map((canto) => (
        <View key={canto.id} style={styles.cardCanto}>
          <Ionicons name="musical-note" size={20} color={COLORS.accent} />
          <Text style={styles.cantoTexto}>{canto.titulo}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.lg - 4, paddingBottom: SPACING.xl + 28 },
  titulo: { fontSize: FONT.titulo, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.xs },
  fecha: { fontSize: FONT.texto, color: COLORS.textMuted, marginBottom: SPACING.sm + 2 },
  badgeTiempo: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFEBFC',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md - 2,
    paddingVertical: SPACING.xs + 2,
    marginBottom: SPACING.lg - 4,
  },
  badgeTiempoTexto: { fontSize: FONT.pequeno - 1, fontWeight: '700', color: COLORS.primary },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.lg - 6,
    marginBottom: SPACING.md - 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SOMBRA_TARJETA,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm + 2 },
  cardTitulo: { fontSize: FONT.subtitulo, fontWeight: '700', color: COLORS.text, marginLeft: SPACING.sm },
  referencia: { fontSize: FONT.texto - 1, fontWeight: '700', color: COLORS.primary, marginBottom: SPACING.xs + 2 },
  resumen: { fontSize: FONT.texto - 1, color: COLORS.textMuted, lineHeight: 21 },
  tituloSeccion: { fontSize: FONT.subtitulo + 3, fontWeight: '800', color: COLORS.text, marginTop: SPACING.sm + 2, marginBottom: SPACING.md - 2 },
  cardCanto: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.sm + 2,
    padding: SPACING.md - 2,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cantoTexto: { fontSize: FONT.texto, color: COLORS.text, marginLeft: SPACING.sm + 2 },
});