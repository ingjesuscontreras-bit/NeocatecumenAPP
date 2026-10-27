import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useComunidad } from '../context/ComunidadContext';
import { construirUnidades, generarSorteo } from '../utils/sorteoAlgorithm';
import { exportarPdfTombola, unirNombres } from '../utils/pdfTombola';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS, FONT, SOMBRA_TARJETA } from '../theme/layout';

// En la web, Alert de React Native no muestra nada: ahí usamos la ventana del navegador.
function avisar(titulo, mensaje = '') {
  if (Platform.OS === 'web') {
    window.alert(mensaje ? `${titulo}\n\n${mensaje}` : titulo);
    return;
  }
  Alert.alert(titulo, mensaje);
}

export default function TombolaScreen() {
  const { comunidadId } = useComunidad();
  const [hermanos, setHermanos] = useState([]);
  const [cargandoHermanos, setCargandoHermanos] = useState(true);

  const [nombreSorteo, setNombreSorteo] = useState('');
  const [numGrupos, setNumGrupos] = useState('3');
  const [esManual, setEsManual] = useState(false);
  const [cabezasSeleccionadas, setCabezasSeleccionadas] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [generandoPdf, setGenerandoPdf] = useState(false);

  const cargarHermanos = useCallback(async () => {
    if (!comunidadId) return;
    setCargandoHermanos(true);
    try {
      const snap = await getDocs(collection(db, 'comunidades', comunidadId, 'hermanos'));
      setHermanos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.log('Error cargando hermanos:', error);
    } finally {
      setCargandoHermanos(false);
    }
  }, [comunidadId]);

  useEffect(() => {
    cargarHermanos();
  }, [cargarHermanos]);

  const unidadesDisponibles = useMemo(() => construirUnidades(hermanos), [hermanos]);
  const numGruposInt = parseInt(numGrupos, 10) || 0;
  const tituloFinal = nombreSorteo.trim() || 'Grupos';

  const toggleCabezaUnidad = (unidad) => {
    const idRepresentativo = unidad.miembros[0].id;
    const idsDeLaUnidad = unidad.miembros.map((m) => m.id);
    const yaSeleccionada = idsDeLaUnidad.some((id) => cabezasSeleccionadas.includes(id));

    if (yaSeleccionada) {
      setCabezasSeleccionadas((prev) => prev.filter((id) => !idsDeLaUnidad.includes(id)));
    } else {
      if (cabezasSeleccionadas.length >= numGruposInt) {
        avisar(
          'Límite alcanzado',
          `Ya elegiste ${numGruposInt} cabeza(s) de grupo. Deselecciona alguna antes de agregar otra.`
        );
        return;
      }
      setCabezasSeleccionadas((prev) => [...prev, idRepresentativo]);
    }
  };

  const unidadEstaSeleccionada = (unidad) =>
    unidad.miembros.some((m) => cabezasSeleccionadas.includes(m.id));

  const handleGenerarSorteo = () => {
    if (hermanos.length === 0) {
      avisar('Sin hermanos', 'Todavía no se ha subido la lista de hermanos.');
      return;
    }
    try {
      const resultado = generarSorteo(hermanos, numGruposInt, esManual, cabezasSeleccionadas);
      setGrupos(resultado);
    } catch (error) {
      avisar('No se pudo generar el sorteo', error.message);
      setGrupos([]);
    }
  };

  const handleDescargarPdf = async () => {
    setGenerandoPdf(true);
    try {
      await exportarPdfTombola(tituloFinal, grupos);
    } catch (error) {
      avisar('No se pudo crear el PDF', error.message);
    } finally {
      setGenerandoPdf(false);
    }
  };

  if (cargandoHermanos) {
    return (
      <View style={styles.cargandoContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.titulo}>🎟️ Tómbola de Grupos</Text>
      <Text style={styles.subtitulo}>Los matrimonios siempre permanecen juntos en el mismo grupo.</Text>

      {hermanos.length === 0 && (
        <View style={styles.cardAviso}>
          <Ionicons name="alert-circle-outline" size={22} color={COLORS.danger} />
          <Text style={styles.avisoTexto}>Todavía no se ha subido la lista de hermanos de la comunidad.</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.label}>Nombre del sorteo</Text>
        <TextInput
          style={styles.inputTexto}
          value={nombreSorteo}
          onChangeText={setNombreSorteo}
          placeholder="Ej: Equipos para Escrutacio"
          placeholderTextColor={COLORS.textMuted}
        />
        <Text style={[styles.textoAyuda, { marginTop: SPACING.xs }]}>Será el título del PDF.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Cantidad de grupos a formar</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={numGrupos}
          onChangeText={(texto) => {
            const limpio = texto.replace(/[^0-9]/g, '');
            setNumGrupos(limpio);
            setCabezasSeleccionadas((prev) => prev.slice(0, parseInt(limpio, 10) || 0));
          }}
          placeholder="Ej: 4"
          placeholderTextColor={COLORS.textMuted}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.filaSwitch}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Elegir cabezas de grupo</Text>
            <Text style={styles.textoAyuda}>{esManual ? 'Modo: Manual' : 'Modo: Aleatorio'}</Text>
          </View>
          <Switch
            value={esManual}
            onValueChange={(valor) => {
              setEsManual(valor);
              setCabezasSeleccionadas([]);
            }}
            trackColor={{ false: '#C6C2E8', true: COLORS.primary }}
            thumbColor={COLORS.card}
          />
        </View>
      </View>

      {esManual && (
        <View style={styles.card}>
          <Text style={styles.label}>Selecciona {numGruposInt || '...'} cabeza(s) de grupo</Text>
          <Text style={styles.textoAyuda}>
            ({cabezasSeleccionadas.length}/{numGruposInt || 0} seleccionadas)
          </Text>

          {unidadesDisponibles.map((unidad) => {
            const seleccionada = unidadEstaSeleccionada(unidad);
            return (
              <TouchableOpacity
                key={unidad.id}
                style={[styles.filaPersona, seleccionada && styles.filaPersonaSeleccionada]}
                onPress={() => toggleCabezaUnidad(unidad)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={seleccionada ? 'checkmark-circle' : 'ellipse-outline'}
                  size={26}
                  color={seleccionada ? COLORS.primary : COLORS.textMuted}
                />
                <Text style={styles.textoPersona}>{unirNombres(unidad.miembros.map((m) => m.nombre))}</Text>
                {unidad.tipo === 'matrimonio' && (
                  <View style={styles.badgeMatrimonio}>
                    <Text style={styles.badgeMatrimonioTexto}>Matrimonio</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <TouchableOpacity style={styles.botonPrincipal} onPress={handleGenerarSorteo} activeOpacity={0.85}>
        <Ionicons name="shuffle" size={28} color="#FFFFFF" />
        <Text style={styles.botonPrincipalTexto}>Generar Sorteo</Text>
      </TouchableOpacity>

      {grupos.length > 0 && (
        <View style={styles.resultados}>
          <Text style={styles.tituloResultados}>{tituloFinal}</Text>

          {grupos.map((grupo) => (
            <View key={grupo.numero} style={styles.cardGrupo}>
              <Text style={styles.cardGrupoCabeza}>
                Grupo {grupo.numero} - {unirNombres(grupo.cabezaNombres)}
              </Text>
              {grupo.unidades.map((nombres, i) => (
                <View key={`${grupo.numero}-${i}`} style={styles.miembroFila}>
                  <Text style={styles.vineta}>•</Text>
                  <Text style={styles.miembroTexto}>{unirNombres(nombres)}</Text>
                </View>
              ))}
            </View>
          ))}

          <TouchableOpacity style={styles.botonPdf} onPress={handleDescargarPdf} disabled={generandoPdf}>
            {generandoPdf ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="document-outline" size={22} color="#FFFFFF" />
                <Text style={styles.botonPdfTexto}>Descargar PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  cargandoContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.lg - 4, paddingBottom: SPACING.xl + 28 },
  titulo: { fontSize: FONT.titulo, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.xs },
  subtitulo: { fontSize: FONT.subtitulo - 2, color: COLORS.textMuted, marginBottom: SPACING.lg - 4 },
  cardAviso: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDEDED',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#F3C9C9',
  },
  avisoTexto: { fontSize: FONT.texto - 1, color: COLORS.danger, marginLeft: SPACING.sm, flex: 1 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.lg - 6,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SOMBRA_TARJETA,
  },
  label: { fontSize: FONT.subtitulo, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm + 2 },
  textoAyuda: { fontSize: FONT.texto - 1, color: COLORS.textMuted },
  input: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm + 2,
    paddingVertical: SPACING.md - 2,
    paddingHorizontal: SPACING.md,
    fontSize: FONT.titulo - 6,
    fontWeight: '600',
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  inputTexto: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm + 2,
    paddingVertical: SPACING.md - 2,
    paddingHorizontal: SPACING.md,
    fontSize: FONT.texto,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  filaSwitch: { flexDirection: 'row', alignItems: 'center' },
  filaPersona: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md - 2,
    paddingHorizontal: SPACING.sm + 4,
    borderRadius: RADIUS.sm + 2,
    marginBottom: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  filaPersonaSeleccionada: { borderColor: COLORS.primary, backgroundColor: '#EFEBFC' },
  textoPersona: { fontSize: FONT.subtitulo - 1, color: COLORS.text, marginLeft: SPACING.sm + 2, flex: 1 },
  badgeMatrimonio: { backgroundColor: '#FFE3D3', borderRadius: RADIUS.lg, paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.xs },
  badgeMatrimonioTexto: { fontSize: FONT.pequeno - 2, fontWeight: '700', color: '#B5501C' },
  botonPrincipal: {
    flexDirection: 'row',
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.lg - 2,
    paddingVertical: SPACING.lg - 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs + 4,
    marginBottom: SPACING.lg,
    ...SOMBRA_TARJETA,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.35,
  },
  botonPrincipalTexto: { color: '#FFFFFF', fontSize: FONT.titulo - 6, fontWeight: '800', marginLeft: SPACING.sm + 2 },
  resultados: { marginTop: SPACING.xs },
  tituloResultados: { fontSize: FONT.subtitulo + 5, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.md - 2 },
  cardGrupo: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.lg - 6,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    ...SOMBRA_TARJETA,
  },
  cardGrupoCabeza: {
    fontSize: FONT.subtitulo + 1,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: SPACING.sm,
  },
  miembroFila: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: SPACING.xs },
  vineta: { fontSize: FONT.texto, color: COLORS.text, marginRight: SPACING.sm, lineHeight: FONT.texto + 6 },
  miembroTexto: { fontSize: FONT.texto, color: COLORS.text, flex: 1, lineHeight: FONT.texto + 6 },
  botonPdf: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg - 2,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  botonPdfTexto: { color: '#FFFFFF', fontSize: FONT.subtitulo, fontWeight: '800', marginLeft: SPACING.sm },
});
