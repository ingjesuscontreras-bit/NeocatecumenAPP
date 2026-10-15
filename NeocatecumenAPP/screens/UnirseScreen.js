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

const COLORS = {
  primary: '#4C3AAE',
  accent: '#FF7A45',
  background: '#F5F4FB',
  card: '#FFFFFF',
  border: '#DAD6F2',
  text: '#221B4D',
  textMuted: '#6E6693',
};

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
  container: { flex: 1, backgroundColor: COLORS.background, padding: 24, justifyContent: 'center' },
  botonVolver: { position: 'absolute', top: 50, left: 20 },
  titulo: { fontSize: 24, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 24 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  label: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  inputCodigo: { fontSize: 20, fontWeight: '700', letterSpacing: 2, textAlign: 'center' },
  boton: {
    backgroundColor: COLORS.accent,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },
  botonTexto: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
});
