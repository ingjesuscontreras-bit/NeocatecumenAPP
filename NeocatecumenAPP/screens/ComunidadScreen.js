import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hermanosDB } from '../data/hermanos';
import { construirUnidades } from '../utils/sorteoAlgorithm';

const COLORS = {
  primary: '#4C3AAE',
  background: '#F5F4FB',
  card: '#FFFFFF',
  border: '#DAD6F2',
  text: '#221B4D',
  textMuted: '#6E6693',
};

export default function ComunidadScreen() {
  const [busqueda, setBusqueda] = useState('');

  // Reusamos la misma lógica de "unidades" del sorteo: matrimonios
  // agrupados en una sola tarjeta, personas individuales en la suya.
  const unidades = useMemo(() => construirUnidades(hermanosDB), []);

  const unidadesFiltradas = useMemo(() => {
    if (!busqueda.trim()) return unidades;
    const textoBusqueda = busqueda.toLowerCase();
    return unidades.filter((u) =>
      u.etiqueta.toLowerCase().includes(textoBusqueda)
    );
  }, [busqueda, unidades]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.titulo}>🤝 Comunidad</Text>
      <Text style={styles.subtitulo}>
        {unidades.length} unidades familiares · {hermanosDB.length} hermanos
      </Text>

      <View style={styles.buscador}>
        <Ionicons name="search" size={20} color={COLORS.textMuted} />
        <TextInput
          style={styles.buscadorInput}
          placeholder="Buscar por nombre..."
          placeholderTextColor={COLORS.textMuted}
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      {unidadesFiltradas.map((unidad) => (
        <View key={unidad.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons
              name={unidad.tipo === 'matrimonio' ? 'heart' : 'person'}
              size={22}
              color={COLORS.primary}
            />
            <Text style={styles.cardTitulo}>{unidad.etiqueta}</Text>
          </View>

          {unidad.miembros.map((persona) => (
            <View key={persona.id} style={styles.filaMiembro}>
              <Text style={styles.filaMiembroNombre}>{persona.nombre}</Text>
              <Text style={styles.filaMiembroDato}>{persona.rol}</Text>
              <Text style={styles.filaMiembroDato}>📞 {persona.telefono}</Text>
            </View>
          ))}
        </View>
      ))}

      {unidadesFiltradas.length === 0 && (
        <Text style={styles.sinResultados}>No se encontraron hermanos con ese nombre.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 20, paddingBottom: 60 },
  titulo: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  subtitulo: { fontSize: 15, color: COLORS.textMuted, marginBottom: 16 },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 18,
  },
  buscadorInput: { flex: 1, fontSize: 16, color: COLORS.text, marginLeft: 8, paddingVertical: 10 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 8,
  },
  cardTitulo: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginLeft: 8 },
  filaMiembro: { marginBottom: 6 },
  filaMiembroNombre: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  filaMiembroDato: { fontSize: 14, color: COLORS.textMuted },
  sinResultados: { fontSize: 16, color: COLORS.textMuted, textAlign: 'center', marginTop: 30 },
});
