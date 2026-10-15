import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { eventosDB } from '../data/eventos';

const COLORS = {
  primary: '#4C3AAE',
  primaryDark: '#332876',
  accent: '#FF7A45',
  background: '#F5F4FB',
  card: '#FFFFFF',
  border: '#DAD6F2',
  text: '#221B4D',
  textMuted: '#6E6693',
};

// Accesos rápidos a las otras pestañas de la app
const ACCESOS_RAPIDOS = [
  { nombre: 'Comunidad', icono: 'people', destino: 'Comunidad' },
  { nombre: 'Tómbola', icono: 'gift', destino: 'Tómbola' },
  { nombre: 'Liturgia', icono: 'book', destino: 'Liturgia' },
];

export default function InicioScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.saludo}>👋 ¡Bienvenido/a!</Text>
      <Text style={styles.subtitulo}>Esto es lo que tienes para esta semana</Text>

      {/* Accesos rápidos */}
      <View style={styles.filaAccesos}>
        {ACCESOS_RAPIDOS.map((acceso) => (
          <TouchableOpacity
            key={acceso.nombre}
            style={styles.accesoRapido}
            onPress={() => navigation.navigate(acceso.destino)}
            activeOpacity={0.7}
          >
            <Ionicons name={acceso.icono} size={30} color={COLORS.primary} />
            <Text style={styles.accesoRapidoTexto}>{acceso.nombre}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Próximos encuentros */}
      <Text style={styles.tituloSeccion}>Próximos encuentros</Text>
      {eventosDB.map((evento) => (
        <View key={evento.id} style={styles.cardEvento}>
          <View style={styles.cardEventoHeader}>
            <Ionicons name="calendar" size={22} color={COLORS.primary} />
            <Text style={styles.cardEventoTitulo}>{evento.titulo}</Text>
          </View>
          <Text style={styles.cardEventoDetalle}>
            📅 {evento.fecha} · 🕗 {evento.hora}
          </Text>
          <Text style={styles.cardEventoDetalle}>📍 {evento.lugar}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 20, paddingBottom: 60 },
  saludo: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  subtitulo: { fontSize: 16, color: COLORS.textMuted, marginBottom: 20 },
  filaAccesos: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 26 },
  accesoRapido: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  accesoRapidoTexto: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginTop: 8 },
  tituloSeccion: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  cardEvento: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardEventoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardEventoTitulo: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginLeft: 8 },
  cardEventoDetalle: { fontSize: 15, color: COLORS.textMuted, marginTop: 2 },
});
