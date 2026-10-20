import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hermanosDB } from '../data/hermanos';
import { construirUnidades, generarSorteo } from '../utils/sorteoAlgorithm';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS, FONT, SOMBRA_TARJETA } from '../theme/layout';

export default function TombolaScreen() {
  const [numGrupos, setNumGrupos] = useState('3');
  const [esManual, setEsManual] = useState(false);
  const [cabezasSeleccionadas, setCabezasSeleccionadas] = useState([]);
  const [grupos, setGrupos] = useState([]);

  const unidadesDisponibles = useMemo(() => construirUnidades(hermanosDB), []);
  const numGruposInt = parseInt(numGrupos, 10) || 0;

  const toggleCabezaUnidad = (unidad) => {
    const idRepresentativo = unidad.miembros[0].id;
    const idsDeLaUnidad = unidad.miembros.map((m) => m.id);

    const yaSeleccionada = idsDeLaUnidad.some((id) => cabezasSeleccionadas.includes(id));

    if (yaSeleccionada) {
      setCabezasSeleccionadas((prev) => prev.filter((id) => !idsDeLaUnidad.includes(id)));
    } else {
      if (cabezasSeleccionadas.length >= numGruposInt) {
        Alert.alert(
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
    try {
      const resultado = generarSorteo(hermanosDB, numGruposInt, esManual, cabezasSeleccionadas);
      setGrupos(resultado);
    } catch (error) {
      Alert.alert('No se pudo generar el sorteo', error.message);
      setGrupos([]);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.titulo}>🎟️ Tómbola de Grupos</Text>
      <Text style={styles.subtitulo}>Los matrimonios siempre permanecen juntos en el mismo grupo.</Text>

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
                <Text style={styles.textoPersona}>{unidad.etiqueta}</Text>
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
          <Text style={styles.tituloResultados}>Equipos formados</Text>
          {grupos.map((grupo) => (
            <View key={grupo.numero} style={styles.cardGrupo}>
              <View style={styles.cardGrupoHeader}>
                <Text style={styles.cardGrupoNumero}>Grupo {grupo.numero}</Text>
                <Text style={styles.cardGrupoCabeza}>👑 {grupo.cabeza}</Text>
              </View>
              {grupo.miembros.map((persona) => (
                <View key={persona.id} style={styles.miembroFila}>
                  <Ionicons name="person" size={18} color={COLORS.primary} style={{ marginRight: SPACING.sm }} />
                  <Text style={styles.miembroTexto}>{persona.nombre}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.lg - 4, paddingBottom: SPACING.xl + 28 },
  titulo: { fontSize: FONT.titulo, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.xs },
  subtitulo: { fontSize: FONT.subtitulo - 2, color: COLORS.textMuted, marginBottom: SPACING.lg - 4 },
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
  cardGrupoHeader: { borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: SPACING.sm + 2, marginBottom: SPACING.sm + 2 },
  cardGrupoNumero: { fontSize: FONT.subtitulo + 3, fontWeight: '800', color: COLORS.primaryDark },
  cardGrupoCabeza: { fontSize: FONT.texto, fontWeight: '600', color: COLORS.text, marginTop: 2 },
  miembroFila: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.xs + 2 },
  miembroTexto: { fontSize: FONT.texto, color: COLORS.text },
});