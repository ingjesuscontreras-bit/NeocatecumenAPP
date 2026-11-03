import React, { useCallback, useEffect, useState } from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet, Linking, Alert, ActivityIndicator, BackHandler } from 'react-native';
import Text from '../components/TextoEscalable';
import AsistenteScreen from './AsistenteScreen';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useComunidad } from '../context/ComunidadContext';
import { informacionLiturgica, HORAS, urlHora, URL_LECTURAS } from '../utils/liturgia';
import { usePantallaAncha } from '../utils/pantallaAncha';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS, FONT, SOMBRA_TARJETA } from '../theme/layout';

const URL_MISAL = 'http://www.ibreviary.com/m2/messale.php?b=1&lang=es';
const URL_ORACIONES = 'http://www.ibreviary.com/m2/preghiere.php?b=1&lang=es';

// ---------- Semana: fechas y enlaces ----------
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const dosDigitos = (n) => String(n).padStart(2, '0');
const fechaISO = (d) => `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`;
const urlLecturasDe = (d) => `https://www.ewtn.com/es/catolicismo/lecturas/${fechaISO(d)}`;

// Lunes de la semana de "fecha", movido "desplazamiento" semanas
function inicioDeSemana(fecha, desplazamiento) {
  const d = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const diasDesdeLunes = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diasDesdeLunes + desplazamiento * 7);
  return d;
}

function diasDeSemana(lunes) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return d;
  });
}

function textoRango(dias) {
  const a = dias[0];
  const b = dias[6];
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()} – ${b.getDate()} ${MESES[b.getMonth()]}`
    : `${a.getDate()} ${MESES[a.getMonth()]} – ${b.getDate()} ${MESES[b.getMonth()]}`;
}

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

function MisasSemana({ hoy }) {
  const [desplazamiento, setDesplazamiento] = useState(0);
  const dias = diasDeSemana(inicioDeSemana(hoy, desplazamiento));
  const hoyISO = fechaISO(hoy);

  return (
    <View style={styles.cardSemana}>
      <View style={styles.semanaCabecera}>
        <TouchableOpacity
          style={styles.flecha}
          onPress={() => setDesplazamiento(desplazamiento - 1)}
          accessibilityRole="button"
          accessibilityLabel="Semana anterior"
        >
          <Ionicons name="chevron-back" size={26} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.semanaCentro}>
          <Text style={styles.semanaRango}>{textoRango(dias)}</Text>
          {desplazamiento !== 0 && (
            <TouchableOpacity onPress={() => setDesplazamiento(0)} accessibilityRole="button">
              <Text style={styles.volverSemana}>Volver a esta semana</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.flecha}
          onPress={() => setDesplazamiento(desplazamiento + 1)}
          accessibilityRole="button"
          accessibilityLabel="Semana siguiente"
        >
          <Ionicons name="chevron-forward" size={26} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {dias.map((d) => {
        const esHoy = fechaISO(d) === hoyISO;
        return (
          <TouchableOpacity
            key={fechaISO(d)}
            style={[styles.dia, esHoy && styles.diaHoy]}
            onPress={() => abrirEnlace(urlLecturasDe(d))}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Lecturas del ${DIAS[d.getDay()]} ${d.getDate()}`}
          >
            <Text style={[styles.diaTexto, esHoy && styles.diaTextoHoy]}>
              {DIAS[d.getDay()]} {d.getDate()} {MESES[d.getMonth()]}
            </Text>
            {esHoy && (
              <View style={styles.etiquetaHoy}>
                <Text style={styles.etiquetaHoyTexto}>Hoy</Text>
              </View>
            )}
            <Ionicons name="open-outline" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        );
      })}

      <Text style={styles.notaGuardar}>
        Para guardar un día: ábrelo y usa Compartir → Imprimir → Guardar como PDF.
      </Text>
    </View>
  );
}

export default function LiturgiaScreen() {
  const { comunidadId } = useComunidad();
  const ancha = usePantallaAncha();
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
    return (
      <View style={ancha ? styles.asistenteAncho : styles.asistenteNormal}>
        <AsistenteScreen onVolver={() => setMostrarAsistente(false)} />
      </View>
    );
  }

  const seccionMisa = (
    <>
      <Text style={styles.seccion}>Misa del día</Text>
      <Fila icono="reader-outline" texto="Lecturas de la Misa" onPress={() => abrirEnlace(URL_LECTURAS)} color={COLORS.accent} />
      <Fila icono="library-outline" texto="Misal" onPress={() => abrirEnlace(URL_MISAL)} color={COLORS.accent} />

      <Text style={styles.subseccion}>Misas de la semana</Text>
      <MisasSemana hoy={hoy} />
    </>
  );

  const seccionHorasYMas = (
    <>
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
    </>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.scrollContent, ancha && styles.contenidoAncho]}>
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

      {ancha ? (
        <View style={styles.columnas}>
          <View style={styles.columna}>{seccionMisa}</View>
          <View style={styles.columna}>{seccionHorasYMas}</View>
        </View>
      ) : (
        <>
          {seccionMisa}
          {seccionHorasYMas}
        </>
      )}

      <Text style={styles.credito}>
        Los textos de la Misa, las horas y las oraciones se abren en iBreviary (Pro Terra Sancta). Las lecturas de la
        semana se abren en EWTN.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.lg - 4, paddingBottom: SPACING.xl + 28 },
  contenidoAncho: { width: '100%', maxWidth: 1100, alignSelf: 'center', paddingHorizontal: 32, paddingTop: 28 },
  columnas: { flexDirection: 'row', alignItems: 'flex-start', gap: 24 },
  columna: { flex: 1, minWidth: 0 },
  asistenteNormal: { flex: 1 },
  asistenteAncho: { flex: 1, width: '100%', maxWidth: 900, alignSelf: 'center' },
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
  subseccion: {
    fontSize: FONT.subtitulo,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.md,
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
  cardSemana: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm + 4,
    ...SOMBRA_TARJETA,
  },
  semanaCabecera: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  flecha: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  semanaCentro: { flex: 1, alignItems: 'center' },
  semanaRango: { fontSize: FONT.subtitulo, fontWeight: '800', color: COLORS.text },
  volverSemana: { fontSize: FONT.pequeno, fontWeight: '700', color: COLORS.primary, marginTop: 2, paddingVertical: 4 },
  dia: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: SPACING.sm + 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  diaHoy: { backgroundColor: '#EFEBFC', borderRadius: RADIUS.sm },
  diaTexto: { flex: 1, fontSize: FONT.texto, color: COLORS.text },
  diaTextoHoy: { fontWeight: '800', color: COLORS.primary },
  etiquetaHoy: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    marginRight: SPACING.sm,
  },
  etiquetaHoyTexto: { fontSize: FONT.pequeno - 2, fontWeight: '700', color: '#FFFFFF' },
  notaGuardar: { fontSize: FONT.pequeno - 1, color: COLORS.textMuted, fontStyle: 'italic', marginTop: SPACING.sm },
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