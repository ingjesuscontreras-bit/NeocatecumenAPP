import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { collection, getDocs, doc, deleteDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useComunidad } from '../context/ComunidadContext';
import { normalizarUrl, diasDesdeHoy, separarAvisos } from '../utils/avisos';
import { textoFecha } from '../utils/eventos';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS, FONT, SOMBRA_TARJETA } from '../theme/layout';

function generarId() {
  return `a_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const valorNuevo = () => ({ titulo: '', mensaje: '', enlace: '', auto: true, fecha: diasDesdeHoy(7) });

// Selector de solo fecha (Android abre una ventanita; iPhone muestra uno compacto)
function CampoFecha({ valor, onCambio }) {
  if (Platform.OS === 'android') {
    return (
      <TouchableOpacity
        style={styles.botonFecha}
        onPress={() =>
          DateTimePickerAndroid.open({
            value: valor,
            mode: 'date',
            minimumDate: new Date(),
            onValueChange: (evento, seleccion) => onCambio(seleccion),
          })
        }
      >
        <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
        <Text style={styles.botonFechaTexto}>{textoFecha(valor)}</Text>
      </TouchableOpacity>
    );
  }
  return (
    <View style={{ alignItems: 'flex-start' }}>
      <DateTimePicker
        value={valor}
        mode="date"
        display="compact"
        locale="es-ES"
        minimumDate={new Date()}
        onValueChange={(evento, seleccion) => seleccion && onCambio(seleccion)}
      />
    </View>
  );
}

// Formulario reutilizado para publicar y para editar
function FormAviso({ valor, onChange, borde }) {
  const poner = (campo) => (v) => onChange({ ...valor, [campo]: v });
  const estiloInput = [styles.input, borde && { borderColor: COLORS.primary }];

  return (
    <View>
      <Text style={styles.label}>Título</Text>
      <TextInput
        style={estiloInput}
        value={valor.titulo}
        onChangeText={poner('titulo')}
        placeholder="Ej: Reunión de responsables"
        placeholderTextColor={COLORS.textMuted}
      />

      <Text style={styles.label}>Mensaje</Text>
      <TextInput
        style={[estiloInput, styles.inputLargo]}
        value={valor.mensaje}
        onChangeText={poner('mensaje')}
        placeholder="Escribe el aviso para tu comunidad..."
        placeholderTextColor={COLORS.textMuted}
        multiline
        textAlignVertical="top"
      />

      <Text style={styles.label}>Enlace (opcional)</Text>
      <TextInput
        style={estiloInput}
        value={valor.enlace}
        onChangeText={poner('enlace')}
        placeholder="https://..."
        placeholderTextColor={COLORS.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />

      <View style={styles.filaSwitch}>
        <Text style={[styles.label, { flex: 1, marginTop: 0 }]}>Ocultar automáticamente</Text>
        <Switch
          value={valor.auto}
          onValueChange={poner('auto')}
          trackColor={{ false: '#C6C2E8', true: COLORS.primary }}
          thumbColor={COLORS.card}
        />
      </View>

      {valor.auto && (
        <>
          <Text style={styles.label}>Se oculta el</Text>
          <CampoFecha valor={valor.fecha} onCambio={poner('fecha')} />
        </>
      )}
    </View>
  );
}

// Valida y arma los datos a guardar (devuelve null si algo falta)
function construirDatos(v) {
  if (!v.titulo.trim()) {
    Alert.alert('Falta el título', 'Escribe un título para el aviso.');
    return null;
  }
  if (!v.mensaje.trim()) {
    Alert.alert('Falta el mensaje', 'Escribe el mensaje del aviso.');
    return null;
  }
  let enlace = '';
  if (v.enlace.trim()) {
    enlace = normalizarUrl(v.enlace);
    if (!enlace) {
      Alert.alert('Enlace no válido', 'Pega un enlace completo, por ejemplo https://...');
      return null;
    }
  }
  let ocultarEn = null;
  if (v.auto) {
    const fin = new Date(v.fecha);
    fin.setHours(23, 59, 59, 0); // se ve durante todo el día elegido
    ocultarEn = fin.toISOString();
  }
  return { titulo: v.titulo.trim(), mensaje: v.mensaje.trim(), enlace, ocultarEn };
}

export default function AdminAvisos() {
  const { comunidadId } = useComunidad();
  const [avisos, setAvisos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [nuevo, setNuevo] = useState(valorNuevo());
  const [publicando, setPublicando] = useState(false);

  const [editandoId, setEditandoId] = useState(null);
  const [edicion, setEdicion] = useState(valorNuevo());
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    if (!comunidadId) return;
    setCargando(true);
    try {
      const snap = await getDocs(collection(db, 'comunidades', comunidadId, 'avisos'));
      setAvisos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      Alert.alert('Error al cargar avisos', error.message);
    } finally {
      setCargando(false);
    }
  }, [comunidadId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handlePublicar = async () => {
    const datos = construirDatos(nuevo);
    if (!datos) return;
    setPublicando(true);
    try {
      await setDoc(doc(db, 'comunidades', comunidadId, 'avisos', generarId()), {
        ...datos,
        creadoEn: new Date().toISOString(),
      });
      setNuevo(valorNuevo());
      await cargar();
      Alert.alert('¡Publicado!', 'El aviso ya está visible para tu comunidad.');
    } catch (error) {
      Alert.alert('Error al publicar', error.message);
    } finally {
      setPublicando(false);
    }
  };

  const iniciarEdicion = (a) => {
    setEditandoId(a.id);
    setEdicion({
      titulo: a.titulo || '',
      mensaje: a.mensaje || '',
      enlace: a.enlace || '',
      auto: !!a.ocultarEn,
      fecha: a.ocultarEn ? new Date(a.ocultarEn) : diasDesdeHoy(7),
    });
  };

  const guardarEdicion = async (id) => {
    const datos = construirDatos(edicion);
    if (!datos) return;
    setGuardando(true);
    try {
      await updateDoc(doc(db, 'comunidades', comunidadId, 'avisos', id), datos);
      setAvisos((prev) => prev.map((a) => (a.id === id ? { ...a, ...datos } : a)));
      setEditandoId(null);
    } catch (error) {
      Alert.alert('Error al guardar', error.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = (aviso) => {
    Alert.alert('Eliminar aviso', `¿Seguro que quieres eliminar "${aviso.titulo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'comunidades', comunidadId, 'avisos', aviso.id));
            setAvisos((prev) => prev.filter((a) => a.id !== aviso.id));
          } catch (error) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const { vigentes, vencidos } = separarAvisos(avisos);

  const renderFila = (a) => (
    <View key={a.id} style={styles.fila}>
      {editandoId === a.id ? (
        <View style={{ flex: 1 }}>
          <FormAviso valor={edicion} onChange={setEdicion} borde />
          <View style={styles.filaBotones}>
            <TouchableOpacity onPress={() => guardarEdicion(a.id)} style={styles.botonOk} disabled={guardando}>
              {guardando ? (
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
            <Text style={styles.filaTitulo}>{a.titulo}</Text>
            <Text style={styles.filaDato} numberOfLines={2}>
              {a.mensaje}
            </Text>
            <Text style={styles.filaDato}>
              {a.ocultarEn ? `Se oculta el ${textoFecha(new Date(a.ocultarEn))}` : 'Sin vencimiento'}
              {a.enlace ? '  ·  🔗 con enlace' : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={() => iniciarEdicion(a)} style={styles.botonIcono}>
            <Ionicons name="pencil-outline" size={18} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleEliminar(a)} style={styles.botonIcono}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitulo}>📢 Avisos importantes</Text>
      <Text style={styles.texto}>Los hermanos los ven en Inicio. Por defecto se ocultan a los 7 días.</Text>

      <FormAviso valor={nuevo} onChange={setNuevo} />

      <TouchableOpacity style={styles.botonPublicar} onPress={handlePublicar} disabled={publicando}>
        {publicando ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="megaphone-outline" size={20} color="#FFFFFF" />
            <Text style={styles.botonPublicarTexto}>Publicar aviso</Text>
          </>
        )}
      </TouchableOpacity>

      {cargando && <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.md }} />}

      {vigentes.length > 0 && <Text style={styles.grupo}>Vigentes</Text>}
      {vigentes.map(renderFila)}

      {vencidos.length > 0 && <Text style={styles.grupo}>Vencidos (ya no se ven en Inicio)</Text>}
      {vencidos.map(renderFila)}
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
  inputLargo: { minHeight: 110 },
  filaSwitch: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md },
  botonFecha: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 44,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm + 4,
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
  botonIcono: { padding: SPACING.xs + 2 },
  filaBotones: { flexDirection: 'row', marginTop: SPACING.md },
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
