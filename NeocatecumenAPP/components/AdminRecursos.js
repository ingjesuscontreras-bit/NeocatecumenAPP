import React, { useCallback, useEffect, useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import Text from './TextoEscalable';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useComunidad } from '../context/ComunidadContext';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS, FONT, SOMBRA_TARJETA } from '../theme/layout';

function generarId() {
  return `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Si falta el "https://", lo agrega. Devuelve null si no parece un enlace válido.
function normalizarUrl(texto) {
  let url = texto.trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  return /^https?:\/\/[^\s/]+\.[^\s/]+/i.test(url) ? url : null;
}

export default function AdminRecursos() {
  const { comunidadId } = useComunidad();
  const [recursos, setRecursos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [titulo, setTitulo] = useState('');
  const [enlace, setEnlace] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    if (!comunidadId) return;
    setCargando(true);
    try {
      const snap = await getDocs(collection(db, 'comunidades', comunidadId, 'recursos'));
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      lista.sort((a, b) => (a.creadoEn || '').localeCompare(b.creadoEn || ''));
      setRecursos(lista);
    } catch (error) {
      Alert.alert('Error al cargar recursos', error.message);
    } finally {
      setCargando(false);
    }
  }, [comunidadId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleAgregar = async () => {
    const url = normalizarUrl(enlace);
    if (!titulo.trim()) {
      Alert.alert('Falta el título', 'Escribe cómo quieres que se llame (ej: Cantos del Camino).');
      return;
    }
    if (!url) {
      Alert.alert('Enlace no válido', 'Pega un enlace completo, por ejemplo https://drive.google.com/...');
      return;
    }
    setGuardando(true);
    try {
      await setDoc(doc(db, 'comunidades', comunidadId, 'recursos', generarId()), {
        titulo: titulo.trim(),
        url,
        creadoEn: new Date().toISOString(),
      });
      setTitulo('');
      setEnlace('');
      await cargar();
    } catch (error) {
      Alert.alert('Error al guardar', error.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = (recurso) => {
    Alert.alert('Quitar enlace', `¿Quitar "${recurso.titulo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'comunidades', comunidadId, 'recursos', recurso.id));
            setRecursos((prev) => prev.filter((r) => r.id !== recurso.id));
          } catch (error) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitulo}>🎵 Recursos de liturgia</Text>
      <Text style={styles.texto}>
        Enlaces que verán los hermanos en la pestaña Liturgia (cantos, salterio, hojas de celebración).
      </Text>

      <Text style={styles.label}>Título</Text>
      <TextInput
        style={styles.input}
        value={titulo}
        onChangeText={setTitulo}
        placeholder="Ej: Cantos del Camino"
        placeholderTextColor={COLORS.textMuted}
      />

      <Text style={styles.label}>Enlace</Text>
      <TextInput
        style={styles.input}
        value={enlace}
        onChangeText={setEnlace}
        placeholder="https://..."
        placeholderTextColor={COLORS.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />

      <TouchableOpacity style={styles.botonAgregar} onPress={handleAgregar} disabled={guardando}>
        {guardando ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.botonAgregarTexto}>Agregar enlace</Text>
          </>
        )}
      </TouchableOpacity>

      {cargando && <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.md }} />}

      {recursos.map((r) => (
        <View key={r.id} style={styles.fila}>
          <View style={{ flex: 1 }}>
            <Text style={styles.filaTitulo}>{r.titulo}</Text>
            <Text style={styles.filaDato} numberOfLines={1}>{r.url}</Text>
          </View>
          <TouchableOpacity onPress={() => handleEliminar(r)} style={styles.botonIcono}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
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
  cardTitulo: { fontSize: FONT.subtitulo + 1, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs },
  texto: { fontSize: FONT.texto - 2, color: COLORS.textMuted, marginBottom: SPACING.sm },
  label: { fontSize: FONT.pequeno, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs, marginTop: SPACING.sm },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.sm + 4,
    fontSize: FONT.texto - 1,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  botonAgregar: {
    flexDirection: 'row',
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm + 4,
    paddingVertical: SPACING.md - 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
  botonAgregarTexto: { color: '#FFFFFF', fontSize: FONT.texto - 1, fontWeight: '700', marginLeft: SPACING.sm },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filaTitulo: { fontSize: FONT.texto - 1, fontWeight: '600', color: COLORS.text },
  filaDato: { fontSize: FONT.pequeno - 2, color: COLORS.textMuted },
  botonIcono: { padding: SPACING.xs + 2 },
});
