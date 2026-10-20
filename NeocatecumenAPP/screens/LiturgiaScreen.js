import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { liturgiaHoy } from '../data/liturgia';

import { COLORS } from '../theme/colors';

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
  scrollContent: { padding: 20, paddingBottom: 60 },
  titulo: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  fecha: { fontSize: 16, color: COLORS.textMuted, marginBottom: 10 },
  badgeTiempo: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFEBFC',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 20,
  },
  badgeTiempoTexto: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitulo: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginLeft: 8 },
  referencia: { fontSize: 15, fontWeight: '700', color: COLORS.primary, marginBottom: 6 },
  resumen: { fontSize: 15, color: COLORS.textMuted, lineHeight: 21 },
  tituloSeccion: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginTop: 10, marginBottom: 12 },
  cardCanto: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cantoTexto: { fontSize: 16, color: COLORS.text, marginLeft: 10 },
});
