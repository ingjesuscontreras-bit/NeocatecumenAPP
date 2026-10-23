import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, doc, deleteDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useComunidad } from '../context/ComunidadContext';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS, FONT, SOMBRA_TARJETA } from '../theme/layout';

function generarId() {
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function AdminCelebraciones() {
  const { comunidadId } = useComunidad();
  const [celebraciones, setCelebraciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Formulario para publicar una nueva
  const [titulo, setTitulo] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [lugar, setLugar] = useState('');
  const [publicando, setPublicando] = useState(false);

  // Edición de una existente
  const [editandoId, setEditandoId] = useState(null);
  const [edTitulo, setEdTitulo] = useState('');
  const [edFecha, setEdFecha] = useState('');
  const [edHora, setEdHora] = useState('');
  const [edLugar, setEdLugar] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  const cargar = useCallback(async () => {
    if (!comunidadId) return;
    setCargando(true);
    try {
      const snap = await getDocs(collection(db, 'comunidades', comunidadId, 'celebraciones'));
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      lista.sort((a, b) => (b.creadoEn || '').localeCompare(a.creadoEn || ''));
      setCelebraciones(lista);
    } catch (error) {
      Alert.alert('Error al cargar celebraciones', error.message);
    } finally {
      setCargando(false);
    }
  }, [comunidadId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // ---------- Publicar ----------
  const handlePublicar = async () => {
    if (!titulo.trim() || !fecha.trim()) {
      Alert.alert('Faltan datos', 'Escribe al menos el título y la fecha.');
      return;
    }
    setPublicando(true);
    try {
      await setDoc(doc(db, 'comunidades', comunidadId, 'celebraciones', generarId()), {
        titulo: titulo.trim(),
        fecha: fecha.trim(),
        hora: hora.trim(),
        lugar: lugar.trim(),
        creadoEn: new Date().toISOString(),
      });
      setTitulo('');
      setFecha('');
      setHora('');
      setLugar('');
      await cargar();
      Alert.alert('¡Publicado!', 'La celebración ya está visible para tu comunidad.');
    } catch (error) {
      Alert.alert('Error al publicar', error.message);
    } finally {
      setPublicando(false);
    }
  };

  // ---------- Editar ----------
  const iniciarEdicion = (c) => {
    setEditandoId(c.id);
    setEdTitulo(c.titulo || '');
    setEdFecha(c.fecha || '');
    setEdHora(c.hora || '');
    setEdLugar(c.lugar || '');
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
  };

  const guardarEdicion = async (id) => {
    if (!edTitulo.trim() || !edFecha.trim()) {
      Alert.alert('Faltan datos', 'El título y la fecha no pueden quedar vacíos.');
      return;
    }
    setGuardandoEdicion(true);
    try {
      const datos = {
        titulo: edTitulo.trim(),
        fecha: edFecha.trim(),
        hora: edHora.trim(),
        lugar: edLugar.trim(),
      };
      await updateDoc(doc(db, 'comunidades', comunidadId, 'celebraciones', id), datos);
      setCelebraciones((prev) => prev.map((c) => (c.id === id ? { ...c, ...datos } : c)));
      setEditandoId(null);
    } catch (error) {
      Alert.alert('Error al guardar', error.message);
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // ---------- Eliminar ----------
  const handleEliminar = (celeb) => {
    Alert.alert('Eliminar celebración', `¿Seguro que quieres eliminar "${celeb.titulo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'comunidades', comunidadId, 'celebraciones', celeb.id));
            setCelebraciones((prev) => prev.filter((c) => c.id !== celeb.id));
          } catch (error) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitulo}>📅 Celebraciones</Text>
      <Text style={styles.texto}>Publica los próximos encuentros de tu comunidad.</Text>

      <Text style={styles.label}>Título</Text>
      <TextInput
        style={styles.input}
        value={titulo}
        onChangeText={setTitulo}
        placeholder="Ej: Celebración de la Palabra"
        placeholderTextColor={COLORS.textMuted}
      />

      <Text style={styles.label}>Fecha</Text>
      <TextInput
        style={styles.input}
        value={fecha}
        onChangeText={setFecha}
        placeholder="Ej: Sábado 24 de octubre"
        placeholderTextColor={COLORS.textMuted}
      />

      <Text style={styles.label}>Hora</Text>
      <TextInput
        style={styles.input}
        value={hora}
        onChangeText={setHora}
        placeholder="Ej: 7:30 PM"
        placeholderTextColor={COLORS.textMuted}
      />

      <Text style={styles.label}>Lugar</Text>
      <TextInput
        style={styles.input}
        value={lugar}
        onChangeText={setLugar}
        placeholder="Ej: Salón Parroquial"
        placeholderTextColor={COLORS.textMuted}
      />

      <TouchableOpacity style={styles.botonPublicar} onPress={handlePublicar} disabled={publicando}>
        {publicando ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="send-outline" size={20} color="#FFFFFF" />
            <Text style={styles.botonPublicarTexto}>Publicar celebración</Text>
          </>
        )}
      </TouchableOpacity>

      {cargando && <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.md }} />}

      {celebraciones.map((c) => (
        <View key={c.id} style={styles.fila}>
          {editandoId === c.id ? (
            <View style={{ flex: 1 }}>
              <TextInput
                style={styles.inputEdicion}
                value={edTitulo}
                onChangeText={setEdTitulo}
                placeholder="Título"
                placeholderTextColor={COLORS.textMuted}
              />
              <TextInput
                style={styles.inputEdicion}
                value={edFecha}
                onChangeText={setEdFecha}
                placeholder="Fecha"
                placeholderTextColor={COLORS.textMuted}
              />
              <TextInput
                style={styles.inputEdicion}
                value={edHora}
                onChangeText={setEdHora}
                placeholder="Hora"
                placeholderTextColor={COLORS.textMuted}
              />
              <TextInput
                style={styles.inputEdicion}
                value={edLugar}
                onChangeText={setEdLugar}
                placeholder="Lugar"
                placeholderTextColor={COLORS.textMuted}
              />
              <View style={styles.filaBotones}>
                <TouchableOpacity
                  onPress={() => guardarEdicion(c.id)}
                  style={styles.botonOk}
                  disabled={guardandoEdicion}
                >
                  {guardandoEdicion ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.botonOkTexto}>Guardar</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={cancelarEdicion} style={styles.botonCancelar}>
                  <Text style={styles.botonCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <View style={{ flex: 1 }}>
                <Text style={styles.filaTitulo}>{c.titulo}</Text>
                <Text style={styles.filaDato}>
                  {c.fecha}
                  {c.hora ? ` · ${c.hora}` : ''}
                </Text>
                {c.lugar ? <Text style={styles.filaDato}>📍 {c.lugar}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => iniciarEdicion(c)} style={styles.botonIcono}>
                <Ionicons name="pencil-outline" size={18} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleEliminar(c)} style={styles.botonIcono}>
                <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
              </TouchableOpacity>
            </>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.lg - 6,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SOMBRA_TARJETA,
  },
  cardTitulo: { fontSize: FONT.subtitulo + 1, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs },
  texto: { fontSize: FONT.texto - 2, color: COLORS.textMuted, marginBottom: SPACING.sm },
  label: { fontSize: FONT.pequeno, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs, marginTop: SPACING.sm },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.sm + 4,
    fontSize: FONT.texto - 1,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  botonPublicar: {
    flexDirection: 'row',
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm + 4,
    paddingVertical: SPACING.md - 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
  botonPublicarTexto: { color: '#FFFFFF', fontSize: FONT.texto - 1, fontWeight: '700', marginLeft: SPACING.sm },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filaTitulo: { fontSize: FONT.texto - 1, fontWeight: '600', color: COLORS.text },
  filaDato: { fontSize: FONT.pequeno - 1, color: COLORS.textMuted },
  botonIcono: { padding: SPACING.xs + 2 },
  inputEdicion: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.xs + 4,
    paddingHorizontal: SPACING.sm,
    fontSize: FONT.texto - 1,
    color: COLORS.text,
    marginBottom: SPACING.xs + 2,
  },
  filaBotones: { flexDirection: 'row', marginTop: SPACING.xs },
  botonOk: {
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.sm + 4,
    marginRight: SPACING.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  botonOkTexto: { color: '#FFFFFF', fontSize: FONT.pequeno, fontWeight: '700' },
  botonCancelar: {
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.sm + 4,
  },
  botonCancelarTexto: { color: COLORS.text, fontSize: FONT.pequeno, fontWeight: '700' },
});