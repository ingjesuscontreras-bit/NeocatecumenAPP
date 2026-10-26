import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { collection, getDocs, doc, deleteDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useComunidad } from '../context/ComunidadContext';
import { textoFecha, textoHora, separar, fechaPorDefecto } from '../utils/eventos';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS, FONT, SOMBRA_TARJETA } from '../theme/layout';

function generarId() {
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Cambia solo la fecha o solo la hora de un Date, sin tocar lo otro
function combinar(base, seleccion, modo) {
  const nuevo = new Date(base);
  if (modo === 'date') {
    nuevo.setFullYear(seleccion.getFullYear(), seleccion.getMonth(), seleccion.getDate());
  } else {
    nuevo.setHours(seleccion.getHours(), seleccion.getMinutes(), 0, 0);
  }
  return nuevo;
}

// Selector de fecha y hora (Android abre ventanitas; iPhone muestra selectores compactos)
function CampoFechaHora({ valor, onCambio }) {
  if (Platform.OS === 'android') {
    const abrir = (modo) => {
      DateTimePickerAndroid.open({
        value: valor,
        mode: modo,
        is24Hour: false,
        onValueChange: (evento, seleccion) => onCambio(combinar(valor, seleccion, modo)),
      });
    };
    return (
      <View style={styles.filaFecha}>
        <TouchableOpacity style={styles.botonFecha} onPress={() => abrir('date')}>
          <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
          <Text style={styles.botonFechaTexto}>{textoFecha(valor)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botonFecha} onPress={() => abrir('time')}>
          <Ionicons name="time-outline" size={18} color={COLORS.primary} />
          <Text style={styles.botonFechaTexto}>{textoHora(valor)}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.filaFecha}>
      <DateTimePicker
        value={valor}
        mode="date"
        display="compact"
        locale="es-ES"
        onValueChange={(evento, seleccion) => seleccion && onCambio(combinar(valor, seleccion, 'date'))}
      />
      <DateTimePicker
        value={valor}
        mode="time"
        display="compact"
        locale="es-ES"
        onValueChange={(evento, seleccion) => seleccion && onCambio(combinar(valor, seleccion, 'time'))}
      />
    </View>
  );
}

export default function AdminCelebraciones() {
  const { comunidadId } = useComunidad();
  const [celebraciones, setCelebraciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Formulario para publicar una nueva
  const [titulo, setTitulo] = useState('');
  const [fechaHora, setFechaHora] = useState(fechaPorDefecto());
  const [lugar, setLugar] = useState('');
  const [publicando, setPublicando] = useState(false);

  // Edición de una existente
  const [editandoId, setEditandoId] = useState(null);
  const [edTitulo, setEdTitulo] = useState('');
  const [edFechaHora, setEdFechaHora] = useState(new Date());
  const [edLugar, setEdLugar] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  const cargar = useCallback(async () => {
    if (!comunidadId) return;
    setCargando(true);
    try {
      const snap = await getDocs(collection(db, 'comunidades', comunidadId, 'celebraciones'));
      setCelebraciones(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      Alert.alert('Error al cargar celebraciones', error.message);
    } finally {
      setCargando(false);
    }
  }, [comunidadId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const datosDeFecha = (d) => ({
    fecha: textoFecha(d),
    hora: textoHora(d),
    fechaHora: d.toISOString(),
  });

  // ---------- Publicar ----------
  const handlePublicar = async () => {
    if (!titulo.trim()) {
      Alert.alert('Falta el título', 'Escribe el nombre de la celebración.');
      return;
    }
    setPublicando(true);
    try {
      await setDoc(doc(db, 'comunidades', comunidadId, 'celebraciones', generarId()), {
        titulo: titulo.trim(),
        lugar: lugar.trim(),
        ...datosDeFecha(fechaHora),
        creadoEn: new Date().toISOString(),
      });
      setTitulo('');
      setLugar('');
      setFechaHora(fechaPorDefecto());
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
    setEdLugar(c.lugar || '');
    setEdFechaHora(c.fechaHora ? new Date(c.fechaHora) : fechaPorDefecto());
  };

  const guardarEdicion = async (id) => {
    if (!edTitulo.trim()) {
      Alert.alert('Falta el título', 'El título no puede quedar vacío.');
      return;
    }
    setGuardandoEdicion(true);
    try {
      const datos = {
        titulo: edTitulo.trim(),
        lugar: edLugar.trim(),
        ...datosDeFecha(edFechaHora),
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

  const { proximas, pasadas } = separar(celebraciones);

  const renderFila = (c) => (
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
          <CampoFechaHora valor={edFechaHora} onCambio={setEdFechaHora} />
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
            <TouchableOpacity onPress={() => setEditandoId(null)} style={styles.botonCancelar}>
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
            {!c.fechaHora ? (
              <Text style={styles.aviso}>Sin fecha exacta: edítala para que se oculte sola.</Text>
            ) : null}
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
  );

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitulo}>📅 Celebraciones</Text>
      <Text style={styles.texto}>
        Publica los próximos encuentros. Se ocultan solos cuando pasa su hora.
      </Text>

      <Text style={styles.label}>Título</Text>
      <TextInput
        style={styles.input}
        value={titulo}
        onChangeText={setTitulo}
        placeholder="Ej: Celebración de la Palabra"
        placeholderTextColor={COLORS.textMuted}
      />

      <Text style={styles.label}>Fecha y hora</Text>
      <CampoFechaHora valor={fechaHora} onCambio={setFechaHora} />

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

      {proximas.length > 0 && <Text style={styles.grupo}>Próximas</Text>}
      {proximas.map(renderFila)}

      {pasadas.length > 0 && <Text style={styles.grupo}>Ya pasaron (no se ven en Inicio)</Text>}
      {pasadas.map(renderFila)}
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
  filaFecha: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: SPACING.xs },
  botonFecha: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm + 4,
    marginRight: SPACING.sm,
    marginTop: SPACING.xs,
  },
  botonFechaTexto: { fontSize: FONT.texto - 1, fontWeight: '600', color: COLORS.text, marginLeft: SPACING.xs + 2 },
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
  grupo: { fontSize: FONT.subtitulo, fontWeight: '800', color: COLORS.text, marginTop: SPACING.md, marginBottom: SPACING.xs },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filaTitulo: { fontSize: FONT.texto - 1, fontWeight: '600', color: COLORS.text },
  filaDato: { fontSize: FONT.pequeno - 1, color: COLORS.textMuted },
  aviso: { fontSize: FONT.pequeno - 2, color: COLORS.accent, fontStyle: 'italic', marginTop: 2 },
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
