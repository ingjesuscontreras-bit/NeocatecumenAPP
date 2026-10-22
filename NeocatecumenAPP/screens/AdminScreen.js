import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useComunidad } from '../context/ComunidadContext';
import AdminHermanos from '../components/AdminHermanos';
import AdminCelebraciones from '../components/AdminCelebraciones';
import AdminMiembros from '../components/AdminMiembros';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS, FONT, SOMBRA_TARJETA } from '../theme/layout';

export default function AdminScreen() {
  const { comunidad, salir, regenerarCodigo } = useComunidad();
  const [cambiando, setCambiando] = useState(false);

  const handleCambiarCodigo = () => {
    Alert.alert(
      'Cambiar el código',
      'Se creará un código nuevo. Los hermanos que ya están dentro siguen con acceso, pero el código anterior dejará de servir para entrar. Úsalo, por ejemplo, después de expulsar a alguien. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cambiar',
          onPress: async () => {
            setCambiando(true);
            try {
              const nuevo = await regenerarCodigo();
              Alert.alert('Código nuevo', `Tu nuevo código es:\n\n${nuevo}`);
            } catch (error) {
              Alert.alert('No se pudo cambiar el código', error.message);
            } finally {
              setCambiando(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.titulo}>🛠️ Panel del Responsable</Text>
      <Text style={styles.subtitulo}>{comunidad?.nombre}</Text>

      <View style={styles.cardCodigo}>
        <Ionicons name="key" size={24} color="#FFFFFF" />
        <View style={{ marginLeft: SPACING.sm + 4, flex: 1 }}>
          <Text style={styles.cardCodigoLabel}>Código de tu comunidad</Text>
          <Text style={styles.cardCodigoValor}>{comunidad?.codigoAcceso}</Text>
        </View>
        <TouchableOpacity
          style={styles.botonCambiar}
          onPress={handleCambiarCodigo}
          disabled={cambiando}
          accessibilityLabel="Cambiar el código"
        >
          {cambiando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Ionicons name="refresh" size={22} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      <AdminCelebraciones />
      <AdminHermanos />
      <AdminMiembros />

      <TouchableOpacity style={styles.botonSalir} onPress={salir}>
        <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
        <Text style={styles.botonSalirTexto}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.lg - 4, paddingBottom: SPACING.xl + 28 },
  titulo: { fontSize: FONT.titulo - 2, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.xs },
  subtitulo: { fontSize: FONT.texto, color: COLORS.textMuted, marginBottom: SPACING.lg - 4 },
  cardCodigo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: SPACING.lg - 6,
    marginBottom: SPACING.md,
    ...SOMBRA_TARJETA,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
  },
  cardCodigoLabel: { fontSize: FONT.pequeno - 1, color: '#D9D3F5', fontWeight: '600' },
  cardCodigoValor: { fontSize: FONT.titulo - 6, color: '#FFFFFF', fontWeight: '800', letterSpacing: 2 },
  botonCambiar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  botonSalir: {
    flexDirection: 'row',
    backgroundColor: COLORS.danger,
    borderRadius: RADIUS.sm + 4,
    paddingVertical: SPACING.md - 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  botonSalirTexto: { color: '#FFFFFF', fontSize: FONT.texto - 1, fontWeight: '700', marginLeft: SPACING.sm },
});
