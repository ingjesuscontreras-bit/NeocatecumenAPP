import React, { useCallback, useEffect, useState } from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet, Linking, Alert, ActivityIndicator } from 'react-native';
import Text from './TextoEscalable';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { informacionLiturgica, urlSantoDelDia } from '../utils/liturgia';
import { obtenerSanto, claveFecha } from '../utils/evangelio';
import { SANTOS_POR_PAIS } from '../utils/santosPais';
import EvangelioDia from './EvangelioDia';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS, FONT } from '../theme/layout';

// Intenta con la ubicación; si no hay permiso, usa la región del teléfono (ej. "es-DO" → "DO")
async function detectarPais() {
  try {
    const permiso = await Location.requestForegroundPermissionsAsync();
    if (permiso.status === 'granted') {
      const posicion =
        (await Location.getLastKnownPositionAsync()) ||
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
      if (posicion) {
        const [lugar] = await Location.reverseGeocodeAsync(posicion.coords);
        if (lugar?.isoCountryCode) return lugar.isoCountryCode.toUpperCase();
      }
    }
  } catch (error) {
    console.log('No se pudo obtener la ubicación:', error);
  }
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const region = locale.split('-')[1];
    if (region) return region.toUpperCase();
  } catch (error) {
    // sin respaldo disponible
  }
  return null;
}

export default function LiturgiaHoy() {
  const navigation = useNavigation();
  const [hoy, setHoy] = useState(new Date());
  const [codigoPais, setCodigoPais] = useState(null);
  const [santo, setSanto] = useState(null);
  const [cargandoSanto, setCargandoSanto] = useState(true);
  const claveHoy = claveFecha(hoy);

  // Actualiza la fecha cada vez que entras a la pestaña
  useFocusEffect(
    useCallback(() => {
      setHoy(new Date());
    }, [])
  );

  useEffect(() => {
    let activo = true;
    detectarPais().then((codigo) => {
      if (activo) setCodigoPais(codigo);
    });
    return () => {
      activo = false;
    };
  }, []);

  // Pre-búsqueda del santo del día al abrir la app
  useEffect(() => {
    let activo = true;
    setCargandoSanto(true);
    obtenerSanto(hoy)
      .then((nombre) => {
        if (activo) setSanto(nombre);
      })
      .catch((error) => {
        console.log('No se pudo cargar el santo del día:', error?.message);
        if (activo) setSanto(null);
      })
      .finally(() => {
        if (activo) setCargandoSanto(false);
      });
    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveHoy]);

  const info = informacionLiturgica(hoy);
  const datosPais = codigoPais ? SANTOS_POR_PAIS[codigoPais] : null;

  const abrir = async (url) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('No se pudo abrir el enlace', 'Revisa tu conexión e inténtalo de nuevo.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      {/* ---------- Liturgia de las Horas (solo información general) ---------- */}
      <View style={styles.card}>
        <View style={styles.encabezado}>
          <Ionicons name="book" size={22} color={COLORS.primary} />
          <Text style={styles.cardTitulo}>Liturgia de las Horas</Text>
        </View>

        <Text style={styles.fecha}>{info.fechaTexto}</Text>
        <Text style={styles.linea}>
          {info.titulo}
          {info.anioFerial ? ` (${info.anioFerial})` : ''}
        </Text>
        <Text style={styles.lineaSuave}>
          Tiempo: {info.tiempo}
          {info.salterio ? `  ·  Salterio: ${info.salterio}ª semana` : ''}
        </Text>

        <TouchableOpacity
          style={styles.fila}
          onPress={() => navigation.navigate('Liturgia')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-forward-circle-outline" size={22} color={COLORS.primary} />
          <Text style={styles.filaTexto}>Rezar las horas y leer la Misa del día</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* ---------- Evangelio del día ---------- */}
      <EvangelioDia fecha={hoy} />

      {/* ---------- Santo del día ---------- */}
      <View style={styles.card}>
        <View style={styles.encabezado}>
          <Ionicons name="sparkles" size={22} color={COLORS.accent} />
          <Text style={styles.cardTitulo}>Santo del día</Text>
        </View>
        <Text style={styles.lineaSuave}>Hoy, {info.fechaCorta}</Text>

        {cargandoSanto && <ActivityIndicator color={COLORS.accent} style={{ marginBottom: SPACING.sm }} />}

        {!cargandoSanto && santo ? (
          <Text style={styles.santoDia} numberOfLines={4}>
            {santo}
          </Text>
        ) : null}

        <TouchableOpacity
          style={styles.botonSecundario}
          onPress={() => abrir(urlSantoDelDia(info.fechaCorta, santo))}
          activeOpacity={0.8}
        >
          <Ionicons name="open-outline" size={20} color={COLORS.primary} />
          <Text style={styles.botonSecundarioTexto}>
            {santo ? 'Ver más sobre este santo' : 'Ver el santo de hoy'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ---------- Santo de tu país ---------- */}
      <View style={styles.card}>
        <View style={styles.encabezado}>
          <Ionicons name="location" size={22} color={COLORS.primary} />
          <Text style={styles.cardTitulo}>Santo de tu país</Text>
        </View>

        {datosPais ? (
          <>
            <Text style={styles.lineaSuave}>📍 {datosPais.pais}</Text>
            {datosPais.santos.map((s) => (
              <View key={s.nombre} style={styles.santoPais}>
                <Text style={styles.santoNombre}>{s.nombre}</Text>
                <Text style={styles.lineaSuave}>Su fiesta: {s.fiesta}</Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.lineaSuave}>
            {codigoPais
              ? `Todavía no tenemos los patronos de tu país (${codigoPais}) en la lista.`
              : 'No pudimos detectar tu país.'}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: SPACING.md, paddingBottom: SPACING.xl + 20 },
  card: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  encabezado: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  cardTitulo: { fontSize: FONT.subtitulo + 1, fontWeight: '800', color: COLORS.text, marginLeft: SPACING.sm },
  fecha: { fontSize: FONT.subtitulo, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs },
  linea: { fontSize: FONT.texto, color: COLORS.text, marginBottom: SPACING.xs },
  lineaSuave: { fontSize: FONT.pequeno, color: COLORS.textMuted, marginBottom: SPACING.sm },
  santoDia: { fontSize: FONT.subtitulo, fontWeight: '700', color: COLORS.text, lineHeight: 24, marginBottom: SPACING.sm },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.sm + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md - 2,
    marginTop: SPACING.xs,
  },
  filaTexto: { flex: 1, fontSize: FONT.texto - 1, fontWeight: '600', color: COLORS.text, marginLeft: SPACING.sm + 2 },
  botonSecundario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.sm + 4,
    marginTop: SPACING.xs,
  },
  botonSecundarioTexto: { color: COLORS.primary, fontSize: FONT.texto, fontWeight: '700', marginLeft: SPACING.sm },
  santoPais: { marginTop: SPACING.xs },
  santoNombre: { fontSize: FONT.subtitulo, fontWeight: '700', color: COLORS.text },
});