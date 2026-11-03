import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import Text from '../components/TextoEscalable';
import { Ionicons } from '@expo/vector-icons';
import { useComunidad } from '../context/ComunidadContext';
import AdminHermanos from '../components/AdminHermanos';
import AdminCelebraciones from '../components/AdminCelebraciones';
import AdminAvisos from '../components/AdminAvisos';
import AdminRecursos from '../components/AdminRecursos';
import AdminMiembros from '../components/AdminMiembros';
import TombolaScreen from './TombolaScreen';
import { usePantallaAncha } from '../utils/pantallaAncha';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS, FONT, SOMBRA_TARJETA } from '../theme/layout';

function avisar(titulo, mensaje = '') {
  if (Platform.OS === 'web') {
    window.alert(mensaje ? `${titulo}\n\n${mensaje}` : titulo);
    return;
  }
  Alert.alert(titulo, mensaje);
}

export default function AdminScreen() {
  const { comunidad, salir, regenerarCodigo } = useComunidad();
  const [cambiando, setCambiando] = useState(false);
  const [verTombola, setVerTombola] = useState(false);
  const ancha = usePantallaAncha();

  const cambiarCodigo = async () => {
    setCambiando(true);
    try {
      const nuevo = await regenerarCodigo();
      avisar('Código nuevo', `Tu nuevo código es:\n\n${nuevo}`);
    } catch (error) {
      avisar('No se pudo cambiar el código', error.message);
    } finally {
      setCambiando(false);
    }
  };

  const handleCambiarCodigo = () => {
    const mensaje =
      'Se creará un código nuevo. Los hermanos que ya están dentro siguen con acceso, pero el código anterior dejará de servir para entrar. Úsalo, por ejemplo, después de expulsar a alguien. ¿Continuar?';
    // En la web, Alert de React Native no muestra nada: usamos la ventana del navegador
    if (Platform.OS === 'web') {
      if (window.confirm(`Cambiar el código\n\n${mensaje}`)) cambiarCodigo();
      return;
    }
    Alert.alert('Cambiar el código', mensaje, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cambiar', onPress: cambiarCodigo },
    ]);
  };

  const tarjetaCodigo = (
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
  );

  const tarjetaTombola = (
      <TouchableOpacity style={styles.cardTombola} onPress={() => setVerTombola(true)} activeOpacity={0.8}>
        <Ionicons name="gift" size={26} color={COLORS.accent} />
        <View style={{ flex: 1, marginLeft: SPACING.sm + 4 }}>
          <Text style={styles.cardTombolaTitulo}>Tómbola de grupos</Text>
          <Text style={styles.cardTombolaTexto}>Sortea los grupos de tu comunidad</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={COLORS.textMuted} />
      </TouchableOpacity>
  );

  const botonSalir = (
      <TouchableOpacity style={styles.botonSalir} onPress={salir}>
        <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
        <Text style={styles.botonSalirTexto}>Cerrar sesión</Text>
      </TouchableOpacity>
  );

  // Vista de la Tómbola dentro del panel
  if (verTombola) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={[styles.botonVolver, ancha && styles.botonVolverAncho]} onPress={() => setVerTombola(false)}>
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
          <Text style={styles.botonVolverTexto}>Volver al panel</Text>
        </TouchableOpacity>
        <View style={ancha ? styles.tombolaAncha : styles.tombolaNormal}>
          <TombolaScreen />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.scrollContent, ancha && styles.contenidoAncho]}>
      <Text style={styles.titulo}>🛠️ Panel del Responsable</Text>
      <Text style={styles.subtitulo}>{comunidad?.nombre}</Text>

      {ancha ? (
        <View style={styles.columnas}>
          <View style={styles.columna}>
            {tarjetaCodigo}
            {tarjetaTombola}
            <AdminAvisos />
            <AdminCelebraciones />
          </View>
          <View style={styles.columna}>
            <AdminRecursos />
            <AdminHermanos />
            <AdminMiembros />
            {botonSalir}
          </View>
        </View>
      ) : (
        <>
          {tarjetaCodigo}
          {tarjetaTombola}
          <AdminAvisos />
          <AdminCelebraciones />
          <AdminRecursos />
          <AdminHermanos />
          <AdminMiembros />
          {botonSalir}
        </>
      )}
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
  contenidoAncho: { width: '100%', maxWidth: 1180, alignSelf: 'center', paddingHorizontal: 32, paddingTop: 28 },
  columnas: { flexDirection: 'row', alignItems: 'flex-start', gap: 24 },
  columna: { flex: 1, minWidth: 0 },
  tombolaNormal: { flex: 1 },
  tombolaAncha: { flex: 1, width: '100%', maxWidth: 900, alignSelf: 'center' },
  botonVolverAncho: { width: '100%', maxWidth: 900, alignSelf: 'center', paddingTop: SPACING.md },
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