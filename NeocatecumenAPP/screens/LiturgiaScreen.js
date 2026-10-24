import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Alert,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import AsistenteScreen from './AsistenteScreen';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useComunidad } from '../context/ComunidadContext';
import { informacionLiturgica, HORAS, urlHora, URL_LECTURAS } from '../utils/liturgia';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS, FONT, SOMBRA_TARJETA } from '../theme/layout';

const URL_MISAL = 'http://www.ibreviary.com/m2/messale.php?b=1&lang=es';
const URL_ORACIONES = 'http://www.ibreviary.com/m2/preghiere.php?b=1&lang=es';

async function abrirEnlace(url) {
  if (!/^https?:\/\//i.test(url)) {
    Alert.alert('Enlace no válido', 'Solo se pueden abrir enlaces web (http o https).');
    return;
  }
  try {
    await Linking.openURL(url);
  } catch (error) {
    Alert.alert('No se pudo abrir el enlace', 'Revisa tu conexión e inténtalo de nuevo.');
  }
}

function Fila({ icono, texto, onPress, color = COLORS.primary }) {
  return (
    <TouchableOpacity style={styles.fila} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icono} size={22} color={color} />
      <Text style={styles.filaTexto}>{texto}</Text>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

export default function LiturgiaScreen() {
  const { comunidadId } = useComunidad();
  const [hoy, setHoy] = useState(new Date());
  const [recursos, setRecursos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarAsistente, setMostrarAsistente] = useState(false);

  // Botón físico "atrás" de Android: cierra el asistente y vuelve a Liturgia
  useEffect(() => {
    if (!mostrarAsistente) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setMostrarAsistente(false);
      return true;
    });
    return () => sub.remove();
  }, [mostrarAsistente]);

  const cargar = useCallback(async () => {
    if (!comunidadId) return;
    try {
      const snap = await getDocs(collection(db, 'comunidades', comunidadId, 'recursos'));
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      lista.sort((a, b) => (a.creadoEn || '').localeCompare(b.creadoEn || ''));
      setRecursos(lista);
    } catch (error) {
      console.log('Error cargando recursos:', error);
    } finally {
      setCargando(false);
    }
  }, [comunidadId]);

  useFocusEffect(
    useCallback(() => {
      setHoy(new Date());
      cargar();
    }, [cargar])
  );

  const info = informacionLiturgica(hoy);

  if (mostrarAsistente) {
    return <AsistenteScreen onVolver={() => setMostrarAsistente(false)} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.titulo}>✝️ Liturgia</Text>

      <View style={styles.cardFecha}>
        <Text style={styles.fecha}>{info.fechaTexto}</Text>
        <Text style={styles.fechaLinea}>
          {info.titulo}
          {info.anioFerial ? ` (${info.anioFerial})` : ''}
        </Text>
        <Text style={styles.fechaSuave}>
          Tiempo: {info.tiempo}
          {info.salterio ? `  ·  Salterio: ${info.salterio}ª semana` : ''}
        </Text>
      </View>

      <Text style={styles.seccion}>Misa del día</Text>
      <Fila icono="reader-outline" texto="Lecturas de la Misa" onPress={() => abrirEnlace(URL_LECTURAS)} color={COLORS.accent} />
      <Fila icono="library-outline" texto="Misal" onPress={() => abrirEnlace(URL_MISAL)} color={COLORS.accent} />

      <Text style={styles.seccion}>Liturgia de las Horas</Text>
      {HORAS.map((h) => (
        <Fila key={h.clave} icono={h.icono} texto={h.nombre} onPress={() => abrirEnlace(urlHora(h.clave))} />
      ))}

      <Text style={styles.seccion}>Oraciones</Text>
      <Fila icono="heart-outline" texto="Oraciones y devociones" onPress={() => abrirEnlace(URL_ORACIONES)} />

      <Text style={styles.seccion}>Recursos de tu comunidad</Text>
      <TouchableOpacity
        style={styles.cardAsistente}
        onPress={() => setMostrarAsistente(true)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Abrir el Asistente Católico"
      >
        <View style={styles.asistenteIcono}>
          <Ionicons name="chatbubbles" size={28} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.asistenteTitulo}>Asistente Católico</Text>
          <Text style={styles.asistenteTexto}>
            Consulta qué dicen la Biblia, el Catecismo, los papas y los santos sobre un tema.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
      </TouchableOpacity>
      {cargando && <ActivityIndicator color={COLORS.primary} />}
      {!cargando && recursos.length === 0 && (
        <View style={styles.cardVacia}>
          <Ionicons name="link-outline" size={26} color={COLORS.textMuted} />
          <Text style={styles.vaciaTexto}>
            Tu responsable todavía no ha agregado enlaces (cantos, salterio, hojas de celebración).
          </Text>
        </View>
      )}
      {recursos.map((r) => (
        <Fila key={r.id} icono="link-outline" texto={r.titulo} onPress={() => abrirEnlace(r.url)} color={COLORS.accent} />
      ))}

      <Text style={styles.credito}>
        Los textos de la Misa, las horas y las oraciones se abren en iBreviary (Pro Terra Sancta).
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.lg - 4, paddingBottom: SPACING.xl + 28 },
  titulo: { fontSize: FONT.titulo, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.md },
  cardFecha: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...SOMBRA_TARJETA,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
  },
  fecha: { fontSize: FONT.subtitulo + 1, fontWeight: '800', color: '#FFFFFF', marginBottom: SPACING.xs },
  fechaLinea: { fontSize: FONT.texto, color: '#FFFFFF', marginBottom: SPACING.xs },
  fechaSuave: { fontSize: FONT.pequeno, color: '#D9D3F5' },
  seccion: {
    fontSize: FONT.subtitulo + 2,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.sm + 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    ...SOMBRA_TARJETA,
  },
  filaTexto: { flex: 1, fontSize: FONT.texto, fontWeight: '600', color: COLORS.text, marginLeft: SPACING.sm + 4 },
  cardAsistente: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SOMBRA_TARJETA,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
  },
  asistenteIcono: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  asistenteTitulo: { fontSize: FONT.subtitulo, fontWeight: '800', color: '#FFFFFF', marginBottom: 2 },
  asistenteTexto: { fontSize: FONT.texto - 2, color: '#F1EEFC', lineHeight: 21 },
  cardVacia: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  vaciaTexto: { fontSize: FONT.texto - 1, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.sm },
  credito: { fontSize: FONT.pequeno - 2, color: COLORS.textMuted, fontStyle: 'italic', marginTop: SPACING.lg },
});
