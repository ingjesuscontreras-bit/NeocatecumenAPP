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

    const yaSeleccionada = idsDeLaUnidad.some((id) =>
      cabezasSeleccionadas.includes(id)
    );

    if (yaSeleccionada) {
      setCabezasSeleccionadas((prev) =>
        prev.filter((id) => !idsDeLaUnidad.includes(id))
      );
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
      const resultado = generarSorteo(
        hermanosDB,
        numGruposInt,
        esManual,
        cabezasSeleccionadas
      );
      setGrupos(resultado);
    } catch (error) {
      Alert.alert('No se pudo generar el sorteo', error.message);
      setGrupos([]);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.titulo}>🎟️ Tómbola de Grupos</Text>
      <Text style={styles.subtitulo}>
        Los matrimonios siempre permanecen juntos en el mismo grupo.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Cantidad de grupos a formar</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={numGrupos}
          onChangeText={(texto) => {
            const limpio = texto.replace(/[^0-9]/g, '');
            setNumGrupos(limpio);
            setCabezasSeleccionadas((prev) =>
              prev.slice(0, parseInt(limpio, 10) || 0)
            );
          }}
          placeholder="Ej: 4"
          placeholderTextColor={COLORS.textMuted}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.filaSwitch}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Elegir cabezas de grupo</Text>
            <Text style={styles.textoAyuda}>
              {esManual ? 'Modo: Manual' : 'Modo: Aleatorio'}
            </Text>
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
          <Text style={styles.label}>
            Selecciona {numGruposInt || '...'} cabeza(s) de grupo
          </Text>
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
                  <Ionicons name="person" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
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
  scrollContent: { padding: 20, paddingBottom: 60 },
  titulo: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  subtitulo: { fontSize: 16, color: COLORS.textMuted, marginBottom: 20 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  label: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  textoAyuda: { fontSize: 15, color: COLORS.textMuted },
  input: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  filaSwitch: { flexDirection: 'row', alignItems: 'center' },
  filaPersona: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  filaPersonaSeleccionada: { borderColor: COLORS.primary, backgroundColor: '#EFEBFC' },
  textoPersona: { fontSize: 17, color: COLORS.text, marginLeft: 10, flex: 1 },
  badgeMatrimonio: { backgroundColor: '#FFE3D3', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeMatrimonioTexto: { fontSize: 12, fontWeight: '700', color: '#B5501C' },
  botonPrincipal: {
    flexDirection: 'row',
    backgroundColor: COLORS.accent,
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  botonPrincipalTexto: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginLeft: 10 },
  resultados: { marginTop: 4 },
  tituloResultados: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 14 },
  cardGrupo: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  cardGrupoHeader: { borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 10, marginBottom: 10 },
  cardGrupoNumero: { fontSize: 20, fontWeight: '800', color: COLORS.primaryDark },
  cardGrupoCabeza: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginTop: 2 },
  miembroFila: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  miembroTexto: { fontSize: 16, color: COLORS.text },
});
