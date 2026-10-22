import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useComunidad } from '../context/ComunidadContext';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS, FONT, SOMBRA_TARJETA } from '../theme/layout';

export default function AdminMiembros() {
  const { comunidadId } = useComunidad();
  const [miembros, setMiembros] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    if (!comunidadId) return;
    setCargando(true);
    try {
      const snap = await getDocs(collection(db, 'comunidades', comunidadId, 'miembros'));
      setMiembros(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      Alert.alert('Error al cargar miembros', error.message);
    } finally {
      setCargando(false);
    }
  }, [comunidadId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleExpulsar = (miembro) => {
    Alert.alert(
      'Expulsar a esta persona',
      `${miembro.nombreMostrado || 'Esta persona'} perderá el acceso a la comunidad. ¿Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Expulsar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'comunidades', comunidadId, 'miembros', miembro.id));
              setMiembros((prev) => prev.filter((m) => m.id !== miembro.id));
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.encabezado}>
        <Text style={styles.cardTitulo}>📱 Celulares con acceso ({miembros.length})</Text>
        <TouchableOpacity onPress={cargar} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {cargando && <ActivityIndicator color={COLORS.primary} />}

      {!cargando && miembros.length === 0 && (
        <Text style={styles.texto}>Todavía nadie se ha unido con tu código.</Text>
      )}

      {miembros.map((m) => (
        <View key={m.id} style={styles.fila}>
          <Text style={styles.nombre}>{m.nombreMostrado || 'Sin nombre'}</Text>
          <TouchableOpacity onPress={() => handleExpulsar(m)} style={styles.boton}>
            <Ionicons name="person-remove-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.lg - 6,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SOMBRA_TARJETA,
  },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  cardTitulo: { fontSize: FONT.subtitulo + 1, fontWeight: '700', color: COLORS.text },
  texto: { fontSize: FONT.texto - 2, color: COLORS.textMuted },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  nombre: { fontSize: FONT.texto - 1, color: COLORS.text },
  boton: { padding: SPACING.xs + 2 },
});
