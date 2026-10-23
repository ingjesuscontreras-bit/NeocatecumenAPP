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
   import AdminAvisos from '../components/AdminAvisos';
import AdminRecursos from '../components/AdminRecursos';
import AdminMiembros from '../components/AdminMiembros';
import TombolaScreen from './TombolaScreen';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS, FONT, SOMBRA_TARJETA } from '../theme/layout';

export default function AdminScreen() {
  const { comunidad, salir, regenerarCodigo } = useComunidad();
  const [cambiando, setCambiando] = useState(false);
  const [verTombola, setVerTombola] = useState(false);

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

  // Vista de la Tómbola dentro del panel
  if (verTombola) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.botonVolver} onPress={() => setVerTombola(false)}>
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
          <Text style={styles.botonVolverTexto}>Volver al panel</Text>
        </TouchableOpacity>
        <TombolaScreen />
      </View>
    );
  }

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

      <TouchableOpacity style={styles.cardTombola} onPress={() => setVerTombola(true)} activeOpacity={0.8}>
        <Ionicons name="gift" size={26} color={COLORS.accent} />
        <View style={{ flex: 1, marginLeft: SPACING.sm + 4 }}>
          <Text style={styles.cardTombolaTitulo}>Tómbola de grupos</Text>
          <Text style={styles.cardTombolaTexto}>Sortea los grupos de tu comunidad</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={COLORS.textMuted} />
      </TouchableOpacity>

   <AdminAvisos />  
      <AdminCelebraciones />
      <AdminRecursos />
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
  botonVolver: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 48,
    paddingHorizontal: SPACING.lg - 4,
  },
  botonVolverTexto: { color: COLORS.primary, fontSize: FONT.texto, fontWeight: '700', marginLeft: SPACING.xs + 2 },
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
  cardTombola: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SOMBRA_TARJETA,
  },
  cardTombolaTitulo: { fontSize: FONT.subtitulo + 1, fontWeight: '700', color: COLORS.text },
  cardTombolaTexto: { fontSize: FONT.pequeno, color: COLORS.textMuted, marginTop: 2 },
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