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
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useComunidad } from '../context/ComunidadContext';
import { leerBytesComoTexto, base64ABytes } from '../utils/leerTexto';
import { parsearListaHermanos, crearPlantillaCsv } from '../utils/parsearHermanosCsv';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS, FONT, SOMBRA_TARJETA } from '../theme/layout';

const ES_WEB = Platform.OS === 'web';

function generarId() {
  return `h_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// En la web, Alert de React Native no muestra nada: ahí usamos las ventanas del navegador.
function avisar(titulo, mensaje = '') {
  if (ES_WEB) {
    window.alert(mensaje ? `${titulo}\n\n${mensaje}` : titulo);
    return;
  }
  Alert.alert(titulo, mensaje);
}

function confirmar(titulo, mensaje, textoSi = 'Sí', destructivo = false) {
  if (ES_WEB) return Promise.resolve(window.confirm(`${titulo}\n\n${mensaje}`));
  return new Promise((resolve) => {
    Alert.alert(
      titulo,
      mensaje,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: textoSi, style: destructivo ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}

async function leerArchivo(archivo) {
  let bytes;
  if (ES_WEB) {
    const buffer = archivo.file
      ? await archivo.file.arrayBuffer()
      : await (await fetch(archivo.uri)).arrayBuffer();
    bytes = new Uint8Array(buffer);
  } else {
    const b64 = await FileSystem.readAsStringAsync(archivo.uri, { encoding: 'base64' });
    bytes = base64ABytes(b64);
  }
  return leerBytesComoTexto(bytes);
}

export default function AdminHermanos() {
  const { comunidadId } = useComunidad();
  const [hermanos, setHermanos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);

  const [editandoId, setEditandoId] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editTelefono, setEditTelefono] = useState('');

  const [mostrarAgregar, setMostrarAgregar] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [esMatrimonio, setEsMatrimonio] = useState(false);
  const [nombrePareja, setNombrePareja] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    if (!comunidadId) return;
    setCargando(true);
    try {
      const snap = await getDocs(collection(db, 'comunidades', comunidadId, 'hermanos'));
      setHermanos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      avisar('Error al cargar hermanos', error.message);
    } finally {
      setCargando(false);
    }
  }, [comunidadId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // ---------- Descargar plantilla ----------
  const handleDescargarPlantilla = async () => {
    const csv = crearPlantillaCsv();
    try {
      if (ES_WEB) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = 'plantilla-hermanos.csv';
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        URL.revokeObjectURL(url);
        return;
      }
      const uri = `${FileSystem.cacheDirectory}plantilla-hermanos.csv`;
      await FileSystem.writeAsStringAsync(uri, csv);
      if (!(await Sharing.isAvailableAsync())) {
        avisar('No se puede compartir', 'Este teléfono no permite compartir archivos.');
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'text/csv',
        dialogTitle: 'Guardar o enviar la plantilla',
        UTI: 'public.comma-separated-values-text',
      });
    } catch (error) {
      avisar('No se pudo crear la plantilla', error.message);
    }
  };

  // ---------- Subir lista llena (reemplaza toda la lista) ----------
  const handleSubirLista = async () => {
    const resultado = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });
    if (resultado.canceled) return;

    const archivo = resultado.assets[0];
    const nombreArchivo = archivo.name || '';
    if (/\.xlsx?$/i.test(nombreArchivo)) {
      avisar(
        'Ese archivo es de Excel',
        'Primero guárdalo como CSV: en Excel, Archivo → Guardar como → "CSV UTF-8". En Google Sheets: Archivo → Descargar → CSV. Luego súbelo.'
      );
      return;
    }

    setSubiendo(true);
    try {
      const contenido = await leerArchivo(archivo);
      const { hermanos: nuevos, errores, matrimonios, solos } = parsearListaHermanos(contenido, nombreArchivo);

      if (nuevos.length === 0) {
        avisar(
          'No se encontró ningún hermano',
          errores.slice(0, 5).join('\n') || 'Revisa que los nombres empiecen en la segunda fila de la plantilla.'
        );
        return;
      }

      const detalleErrores = errores.length
        ? `\n\n⚠️ Revisa esto:\n${errores.slice(0, 5).join('\n')}${
            errores.length > 5 ? `\n…y ${errores.length - 5} más.` : ''
          }`
        : '';

      const ok = await confirmar(
        'Confirmar carga',
        `Se cargarán ${nuevos.length} personas: ${matrimonios} matrimonio(s) y ${solos} persona(s) sola(s).` +
          detalleErrores +
          '\n\nEsto REEMPLAZARÁ la lista actual de hermanos. ¿Continuar?',
        'Sí, reemplazar',
        true
      );
      if (ok) await reemplazarLista(nuevos);
    } catch (error) {
      avisar('Error al leer el archivo', error.message);
    } finally {
      setSubiendo(false);
    }
  };

  const reemplazarLista = async (nuevos) => {
    try {
      const refHermanos = collection(db, 'comunidades', comunidadId, 'hermanos');
      const snapActual = await getDocs(refHermanos);
      for (let i = 0; i < snapActual.docs.length; i += 450) {
        const batchBorrado = writeBatch(db);
        snapActual.docs.slice(i, i + 450).forEach((d) => batchBorrado.delete(d.ref));
        await batchBorrado.commit();
      }

      for (let i = 0; i < nuevos.length; i += 450) {
        const batch = writeBatch(db);
        nuevos.slice(i, i + 450).forEach((h) => {
          batch.set(doc(db, 'comunidades', comunidadId, 'hermanos', h.id), {
            nombre: h.nombre,
            telefono: h.telefono,
            parejaId: h.parejaId,
          });
        });
        await batch.commit();
      }
      avisar('¡Listo!', 'La lista de hermanos se actualizó correctamente.');
      cargar();
    } catch (error) {
      avisar('Error al guardar', error.message);
    }
  };

  // ---------- Agregar uno manualmente ----------
  const handleGuardarNuevo = async () => {
    if (!nuevoNombre.trim()) {
      avisar('Falta el nombre', 'Escribe al menos el nombre del hermano.');
      return;
    }
    if (esMatrimonio && !nombrePareja.trim()) {
      avisar('Falta la pareja', 'Escribe el nombre del cónyuge, o desactiva "Es un matrimonio".');
      return;
    }

    setGuardando(true);
    try {
      const refCol = (id) => doc(db, 'comunidades', comunidadId, 'hermanos', id);
      if (esMatrimonio) {
        const id1 = generarId();
        const id2 = generarId();
        await setDoc(refCol(id1), { nombre: nuevoNombre.trim(), telefono: nuevoTelefono.trim(), parejaId: id2 });
        await setDoc(refCol(id2), { nombre: nombrePareja.trim(), telefono: nuevoTelefono.trim(), parejaId: id1 });
      } else {
        await setDoc(refCol(generarId()), { nombre: nuevoNombre.trim(), telefono: nuevoTelefono.trim(), parejaId: null });
      }
      setNuevoNombre('');
      setNuevoTelefono('');
      setNombrePareja('');
      setEsMatrimonio(false);
      setMostrarAgregar(false);
      cargar();
    } catch (error) {
      avisar('Error al guardar', error.message);
    } finally {
      setGuardando(false);
    }
  };

  // ---------- Editar ----------
  const iniciarEdicion = (h) => {
    setEditandoId(h.id);
    setEditNombre(h.nombre);
    setEditTelefono(h.telefono || '');
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setEditNombre('');
    setEditTelefono('');
  };

  const guardarEdicion = async (id) => {
    if (!editNombre.trim()) {
      avisar('Falta el nombre', 'El nombre no puede quedar vacío.');
      return;
    }
    try {
      await updateDoc(doc(db, 'comunidades', comunidadId, 'hermanos', id), {
        nombre: editNombre.trim(),
        telefono: editTelefono.trim(),
      });
      setHermanos((prev) =>
        prev.map((h) => (h.id === id ? { ...h, nombre: editNombre.trim(), telefono: editTelefono.trim() } : h))
      );
      cancelarEdicion();
    } catch (error) {
      avisar('Error al guardar', error.message);
    }
  };

  // ---------- Eliminar ----------
  const eliminar = async (id, parejaId, tambienPareja) => {
    try {
      await deleteDoc(doc(db, 'comunidades', comunidadId, 'hermanos', id));
      if (parejaId) {
        if (tambienPareja) {
          await deleteDoc(doc(db, 'comunidades', comunidadId, 'hermanos', parejaId));
        } else {
          await updateDoc(doc(db, 'comunidades', comunidadId, 'hermanos', parejaId), { parejaId: null });
        }
      }
      cargar();
    } catch (error) {
      avisar('Error al eliminar', error.message);
    }
  };

  const handleEliminar = async (h) => {
    if (h.parejaId) {
      const pareja = hermanos.find((x) => x.id === h.parejaId);
      const nombrePar = pareja?.nombre || 'su cónyuge';
      if (ES_WEB) {
        if (!window.confirm(`¿Eliminar a ${h.nombre}?`)) return;
        const ambos = window.confirm(
          `${h.nombre} está vinculado(a) con ${nombrePar}.\n\n¿Eliminar también a ${nombrePar}?\n\nAceptar = a ambos\nCancelar = solo a ${h.nombre}`
        );
        eliminar(h.id, h.parejaId, ambos);
        return;
      }
      Alert.alert(
        'Esta persona tiene pareja',
        `${h.nombre} está vinculado(a) con ${nombrePar}. ¿Qué deseas hacer?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Solo a esta persona', onPress: () => eliminar(h.id, h.parejaId, false) },
          { text: 'A ambos', style: 'destructive', onPress: () => eliminar(h.id, h.parejaId, true) },
        ]
      );
    } else {
      const ok = await confirmar('Eliminar hermano', `¿Seguro que quieres eliminar a ${h.nombre}?`, 'Eliminar', true);
      if (ok) eliminar(h.id, null, false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitulo}>👨‍👩‍👧‍👦 Lista de hermanos ({hermanos.length})</Text>

      <TouchableOpacity
        style={[styles.botonSecundario, { marginTop: 0, marginBottom: SPACING.sm }]}
        onPress={handleDescargarPlantilla}
      >
        <Ionicons name="download-outline" size={20} color={COLORS.primary} />
        <Text style={styles.botonSecundarioTexto}>Descargar plantilla (Excel / CSV)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.botonPrincipal} onPress={handleSubirLista} disabled={subiendo}>
        {subiendo ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
            <Text style={styles.botonPrincipalTexto}>Subir lista llena (reemplaza todo)</Text>
          </>
        )}
      </TouchableOpacity>
      <Text style={styles.ayuda}>
        Llena la plantilla en Excel o Google Sheets: una fila por familia. Si es matrimonio, llena las 4 columnas;
        si va solo(a), deja vacías las dos últimas. Guárdala como CSV y súbela. También acepta el .txt de antes.
      </Text>

      <TouchableOpacity style={styles.botonSecundario} onPress={() => setMostrarAgregar(!mostrarAgregar)}>
        <Ionicons
          name={mostrarAgregar ? 'remove-circle-outline' : 'add-circle-outline'}
          size={20}
          color={COLORS.primary}
        />
        <Text style={styles.botonSecundarioTexto}>
          {mostrarAgregar ? 'Cancelar' : 'Agregar un hermano manualmente'}
        </Text>
      </TouchableOpacity>

      {mostrarAgregar && (
        <View style={styles.form}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={nuevoNombre}
            onChangeText={setNuevoNombre}
            placeholder="Ej: Rosa Martínez"
            placeholderTextColor={COLORS.textMuted}
          />
          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            value={nuevoTelefono}
            onChangeText={setNuevoTelefono}
            placeholder="809-555-0000"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="phone-pad"
          />
          <View style={styles.filaSwitch}>
            <Text style={styles.label}>Es un matrimonio</Text>
            <Switch
              value={esMatrimonio}
              onValueChange={setEsMatrimonio}
              trackColor={{ false: '#C6C2E8', true: COLORS.primary }}
              thumbColor={COLORS.card}
            />
          </View>
          {esMatrimonio && (
            <>
              <Text style={styles.label}>Nombre de la pareja</Text>
              <TextInput
                style={styles.input}
                value={nombrePareja}
                onChangeText={setNombrePareja}
                placeholder="Ej: Antonio Martínez"
                placeholderTextColor={COLORS.textMuted}
              />
            </>
          )}
          <TouchableOpacity style={styles.botonGuardar} onPress={handleGuardarNuevo} disabled={guardando}>
            {guardando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.botonPrincipalTexto}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {cargando && <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.md }} />}

      {hermanos.map((h) => (
        <View key={h.id} style={styles.fila}>
          {editandoId === h.id ? (
            <View style={{ flex: 1 }}>
              <TextInput
                style={styles.inputEdicion}
                value={editNombre}
                onChangeText={setEditNombre}
                placeholder="Nombre"
                placeholderTextColor={COLORS.textMuted}
              />
              <TextInput
                style={styles.inputEdicion}
                value={editTelefono}
                onChangeText={setEditTelefono}
                placeholder="Teléfono"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
              />
              <View style={styles.filaBotones}>
                <TouchableOpacity onPress={() => guardarEdicion(h.id)} style={styles.botonOk}>
                  <Text style={styles.botonOkTexto}>Guardar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={cancelarEdicion} style={styles.botonCancelar}>
                  <Text style={styles.botonCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <View style={{ flex: 1 }}>
                <Text style={styles.filaNombre}>{h.nombre}</Text>
                <Text style={styles.filaDato}>📞 {h.telefono || 'Sin teléfono'}</Text>
              </View>
              <TouchableOpacity onPress={() => iniciarEdicion(h)} style={styles.botonIcono}>
                <Ionicons name="pencil-outline" size={18} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleEliminar(h)} style={styles.botonIcono}>
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
  cardTitulo: { fontSize: FONT.subtitulo + 1, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  botonPrincipal: {
    flexDirection: 'row',
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm + 4,
    paddingVertical: SPACING.md - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonPrincipalTexto: { color: '#FFFFFF', fontSize: FONT.texto - 1, fontWeight: '700', marginLeft: SPACING.sm },
  ayuda: { fontSize: FONT.pequeno - 2, color: COLORS.textMuted, marginTop: SPACING.sm, fontStyle: 'italic' },
  botonSecundario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.sm + 4,
    paddingVertical: SPACING.sm + 4,
    marginTop: SPACING.md,
  },
  botonSecundarioTexto: { color: COLORS.primary, fontSize: FONT.texto - 2, fontWeight: '700', marginLeft: SPACING.xs + 2 },
  form: { marginTop: SPACING.md, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
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
  filaSwitch: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.sm },
  botonGuardar: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm + 4,
    paddingVertical: SPACING.sm + 4,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filaNombre: { fontSize: FONT.texto - 1, fontWeight: '600', color: COLORS.text },
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
