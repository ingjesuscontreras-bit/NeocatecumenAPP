import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useComunidad } from '../context/ComunidadContext';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS, FONT, SOMBRA_TARJETA } from '../theme/layout';

export default function UnirseScreen({ onVolver }) {
  const { unirseConCodigo } = useComunidad();
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleUnirse = async () => {
    if (!codigo.trim() || !nombre.trim()) {
      Alert.alert('Faltan datos', 'Escribe tu nombre y el código de tu comunidad.');
      return;
    }
    setCargando(true);
    try {
      await unirseConCodigo(codigo, nombre);
    } catch (error) {
      Alert.alert('No se pudo unir', error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onVolver} style={styles.botonVolver}>
        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>

      <Text style={styles.titulo}>Unirme a mi comunidad</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Tu nombre</Text>
        <TextInput
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Ej: Juan Pérez"
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.label}>Código de la comunidad</Text>
        <TextInput
          style={[styles.input, styles.inputCodigo]}
          value={codigo}
          onChangeText={setCodigo}
          placeholder="Ej: X7K9-PQ2M"
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="characters"
        />
      </View>

      <TouchableOpacity style={styles.boton} onPress={handleUnirse} disabled={cargando}>
        {cargando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.botonTexto}>Entrar</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg, justifyContent: 'center' },
  botonVolver: { position: 'absolute', top: 50, left: SPACING.lg - 4 },
  titulo: {
    fontSize: FONT.titulo - 4,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.lg - 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    ...SOMBRA_TARJETA,
  },
  label: { fontSize: FONT.subtitulo - 2, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs + 2, marginTop: SPACING.sm + 2 },
  input: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm + 2,
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.md - 2,
    fontSize: FONT.texto,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  inputCodigo: { fontSize: FONT.titulo - 8, fontWeight: '700', letterSpacing: 2, textAlign: 'center' },
  boton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md + 2,
    paddingVertical: SPACING.lg - 4,
    alignItems: 'center',
    ...SOMBRA_TARJETA,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.3,
  },
  botonTexto: { color: '#FFFFFF', fontSize: FONT.subtitulo + 1, fontWeight: '800' },
});