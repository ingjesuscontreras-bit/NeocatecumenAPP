import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
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

export default function AdminAccesoScreen({ onVolver }) {
  const { loginAdmin, crearComunidad, recuperarContrasena } = useComunidad();
  const [modoCrear, setModoCrear] = useState(false);
  const [nombreComunidad, setNombreComunidad] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleEnviar = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Faltan datos', 'Completa correo y contraseña.');
      return;
    }
    setCargando(true);
    try {
      if (modoCrear) {
        if (!nombreComunidad.trim()) {
          Alert.alert('Falta el nombre', 'Escribe el nombre de tu comunidad.');
          setCargando(false);
          return;
        }
        const codigo = await crearComunidad(nombreComunidad.trim(), email.trim(), password);
        Alert.alert(
          '¡Comunidad creada!',
          `Tu código de acceso es:\n\n${codigo}\n\nCompártelo con los hermanos de tu comunidad.`
        );
      } else {
        await loginAdmin(email.trim(), password);
      }
    } catch (error) {
      Alert.alert('Ocurrió un error', traducirError(error.code));
    } finally {
      setCargando(false);
    }
  };

  const handleRecuperarContrasena = () => {
    if (!email.trim()) {
      Alert.alert('Falta tu correo', 'Escribe tu correo arriba primero.');
      return;
    }
    recuperarContrasena(email.trim())
      .then(() => Alert.alert('Correo enviado', 'Revisa tu bandeja de entrada para restablecer tu contraseña.'))
      .catch(() => Alert.alert('Error', 'No se pudo enviar el correo. Verifica que esté bien escrito.'));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={onVolver} style={styles.botonVolver}>
        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>

      <Text style={styles.titulo}>
        {modoCrear ? 'Crear mi comunidad' : 'Acceso del Responsable'}
      </Text>

      <View style={styles.card}>
        {modoCrear && (
          <>
            <Text style={styles.label}>Nombre de la comunidad</Text>
            <TextInput
              style={styles.input}
              value={nombreComunidad}
              onChangeText={setNombreComunidad}
              placeholder="Ej: San Juan Bautista"
              placeholderTextColor={COLORS.textMuted}
            />
          </>
        )}

        <Text style={styles.label}>Correo</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="correo@ejemplo.com"
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Mínimo 6 caracteres"
          placeholderTextColor={COLORS.textMuted}
        />
      </View>

      <TouchableOpacity style={styles.boton} onPress={handleEnviar} disabled={cargando}>
        {cargando ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.botonTexto}>{modoCrear ? 'Crear comunidad' : 'Entrar'}</Text>
        )}
      </TouchableOpacity>

      {!modoCrear && (
        <TouchableOpacity onPress={handleRecuperarContrasena} style={styles.link}>
          <Text style={styles.linkTexto}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => setModoCrear(!modoCrear)} style={styles.link}>
        <Text style={styles.linkTexto}>
          {modoCrear ? '¿Ya tienes una comunidad? Inicia sesión' : '¿Primera vez? Crea tu comunidad'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function traducirError(codigo) {
  const mensajes = {
    'auth/invalid-email': 'El correo no es válido.',
    'auth/user-not-found': 'No existe una cuenta con ese correo.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  };
  return mensajes[codigo] || 'Ocurrió un error inesperado.';
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: COLORS.background, padding: 24, justifyContent: 'center' },
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
  boton: { backgroundColor: COLORS.accent, borderRadius: 18, paddingVertical: 18, alignItems: 'center' },
  botonTexto: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  link: { marginTop: 18, alignItems: 'center' },
  linkTexto: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },
});
