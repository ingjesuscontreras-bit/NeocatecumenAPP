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
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS, FONT, SOMBRA_TARJETA } from '../theme/layout';

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
    <View style={styles.pantalla}>
      {/* Fila fija de arriba, nunca se superpone con el contenido */}
      <View style={styles.headerFila}>
        <TouchableOpacity onPress={onVolver} style={styles.botonVolver} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
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
    </View>
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
  pantalla: { flex: 1, backgroundColor: COLORS.background },
  headerFila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg - 4,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  botonVolver: { padding: SPACING.xs + 2 },
  container: { flexGrow: 1, padding: SPACING.lg, paddingTop: SPACING.sm, justifyContent: 'center' },
  titulo: { fontSize: FONT.titulo - 4, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: SPACING.lg },
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
  link: { marginTop: SPACING.md + 2, alignItems: 'center' },
  linkTexto: { color: COLORS.primary, fontSize: FONT.subtitulo - 2, fontWeight: '700' },
});
