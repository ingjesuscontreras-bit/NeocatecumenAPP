import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import {
  informacionLiturgica,
  HORAS,
  urlHora,
  URL_LECTURAS,
  urlSantoDelDia,
} from '../utils/liturgia';
import { SANTOS_POR_PAIS } from '../utils/santosPais';
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
  const [hoy, setHoy] = useState(new Date());
  const [codigoPais, setCodigoPais] = useState(null);

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
      {/* ---------- Liturgia de las Horas ---------- */}
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

        {HORAS.map((h) => (
          <TouchableOpacity
            key={h.clave}
            style={styles.fila}
            onPress={() => abrir(urlHora(h.clave))}
            activeOpacity={0.7}
          >
            <Ionicons name={h.icono} size={22} color={COLORS.primary} />
            <Text style={styles.filaTexto}>{h.nombre}</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.fila}
          onPress={() => abrir(URL_LECTURAS)}
          activeOpacity={0.7}
        >
          <Ionicons name="reader-outline" size={22} color={COLORS.accent} />
          <Text style={styles.filaTexto}>Lecturas de la Misa del día</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        <Text style={styles.credito}>Los textos se abren en iBreviary (Pro Terra Sancta).</Text>
      </View>

      {/* ---------- Santo del día ---------- */}
      <View style={styles.card}>
        <View style={styles.encabezado}>
          <Ionicons name="sparkles" size={22} color={COLORS.accent} />
          <Text style={styles.cardTitulo}>Santo del día</Text>
        </View>
        <Text style={styles.linea}>Hoy, {info.fechaCorta}</Text>
        <TouchableOpacity
          style={styles.botonSecundario}
          onPress={() => abrir(urlSantoDelDia(info.fechaCorta))}
          activeOpacity={0.8}
        >
          <Ionicons name="open-outline" size={20} color={COLORS.primary} />
          <Text style={styles.botonSecundarioTexto}>Ver el santo de hoy</Text>
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
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.sm + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md - 2,
    marginTop: SPACING.sm,
  },
  filaTexto: { flex: 1, fontSize: FONT.texto, fontWeight: '600', color: COLORS.text, marginLeft: SPACING.sm + 2 },
  credito: { fontSize: FONT.pequeno - 2, color: COLORS.textMuted, fontStyle: 'italic', marginTop: SPACING.sm + 2 },
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
