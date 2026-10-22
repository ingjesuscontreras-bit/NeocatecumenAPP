import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useComunidad } from '../context/ComunidadContext';
import LiturgiaHoy from '../components/LiturgiaHoy';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS, FONT, SOMBRA_TARJETA } from '../theme/layout';

export default function InicioScreen() {
  const { salir, comunidad, comunidadId, modo } = useComunidad();
  const [celebraciones, setCelebraciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    if (!comunidadId) return;
    try {
      const snap = await getDocs(collection(db, 'comunidades', comunidadId, 'celebraciones'));
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      lista.sort((a, b) => (b.creadoEn || '').localeCompare(a.creadoEn || ''));
      setCelebraciones(lista);
    } catch (error) {
      console.log('Error cargando celebraciones:', error);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [comunidadId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const handleCambiarModo = () => {
    Alert.alert(
      'Cambiar de modo',
      `Ahora estás como ${modo === 'admin' ? 'Responsable' : 'Hermano'}. ¿Quieres salir y volver a la pantalla de inicio?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: salir },
      ]
    );
  };

  return (
    <View style={styles.pantalla}>
      {/* ========== MITAD SUPERIOR ========== */}
      <View style={styles.mitadSuperior}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={() => {
                setRefrescando(true);
                cargar();
              }}
              tintColor={COLORS.primary}
            />
          }
        >
          <Text style={styles.saludo}>👋 ¡Bienvenido/a!</Text>

          <View style={styles.banner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerEtiqueta}>TU COMUNIDAD</Text>
              <Text style={styles.bannerNombre} numberOfLines={2}>
                {comunidad?.nombre || 'Tu comunidad'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.botonModo}
              onPress={handleCambiarModo}
              accessibilityLabel="Cambiar de modo"
            >
              <Ionicons name="swap-horizontal" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.tituloSeccion}>Próximos encuentros</Text>

          {cargando && <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.md }} />}

          {!cargando && celebraciones.length === 0 && (
            <View style={styles.cardVacia}>
              <Ionicons name="calendar-outline" size={28} color={COLORS.textMuted} />
              <Text style={styles.vaciaTexto}>
                Tu responsable todavía no ha publicado celebraciones.
              </Text>
            </View>
          )}

          {celebraciones.map((c) => (
            <View key={c.id} style={styles.cardEvento}>
              <View style={styles.cardEventoHeader}>
                <Ionicons name="calendar" size={22} color={COLORS.primary} />
                <Text style={styles.cardEventoTitulo}>{c.titulo}</Text>
              </View>
              <Text style={styles.cardEventoDetalle}>
                📅 {c.fecha}
                {c.hora ? `  ·  🕗 ${c.hora}` : ''}
              </Text>
              {c.lugar ? <Text style={styles.cardEventoDetalle}>📍 {c.lugar}</Text> : null}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* ========== MITAD INFERIOR ========== */}
      <View style={styles.mitadInferior}>
        <LiturgiaHoy />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: COLORS.background },
  mitadSuperior: { flex: 1 },
  mitadInferior: {
    flex: 1.1,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.lg + 6,
    borderTopRightRadius: RADIUS.lg + 6,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SOMBRA_TARJETA,
    shadowOffset: { width: 0, height: -3 },
  },
  scrollContent: { padding: SPACING.md, paddingBottom: SPACING.lg },
  saludo: { fontSize: FONT.titulo - 4, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.sm },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg - 4,
    ...SOMBRA_TARJETA,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
  },
  bannerEtiqueta: { fontSize: FONT.pequeno - 2, fontWeight: '700', letterSpacing: 1.5, color: '#D9D3F5' },
  bannerNombre: { fontSize: FONT.titulo, fontWeight: '800', color: '#FFFFFF', marginTop: 2 },
  botonModo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  tituloSeccion: { fontSize: FONT.subtitulo + 3, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.sm + 2 },
  cardVacia: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  vaciaTexto: { fontSize: FONT.texto - 1, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.sm },
  cardEvento: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SOMBRA_TARJETA,
  },
  cardEventoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  cardEventoTitulo: { fontSize: FONT.subtitulo, fontWeight: '700', color: COLORS.text, marginLeft: SPACING.sm, flex: 1 },
  cardEventoDetalle: { fontSize: FONT.texto - 1, color: COLORS.textMuted, marginTop: 2 },
});