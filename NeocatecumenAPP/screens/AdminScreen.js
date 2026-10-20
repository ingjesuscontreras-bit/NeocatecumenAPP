import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useComunidad } from '../context/ComunidadContext';
import { parsearHermanosTxt } from '../utils/parsearHermanosTxt';

import { COLORS } from '../theme/colors';

export default function AdminScreen() {
  const { comunidad, comunidadId, salir } = useComunidad();

  const [hermanos, setHermanos] = useState([]);
  const [miembros, setMiembros] = useState([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [subiendoTxt, setSubiendoTxt] = useState(false);

  const cargarDatos = useCallback(async () => {
    if (!comunidadId) return;
    setCargandoDatos(true);
    try {
      const snapHermanos = await getDocs(collection(db, 'comunidades', comunidadId, 'hermanos'));
      setHermanos(snapHermanos.docs.map((d) => ({ id: d.id, ...d.data() })));

      const snapMiembros = await getDocs(collection(db, 'comunidades', comunidadId, 'miembros'));
      setMiembros(snapMiembros.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      Alert.alert('Error al cargar datos', error.message);
    } finally {
      setCargandoDatos(false);
    }
  }, [comunidadId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // --- Subir y procesar el archivo TXT --------------------------------
  const handleSubirTxt = async () => {
    const resultado = await DocumentPicker.getDocumentAsync({
      type: ['text/plain', 'text/*'],
      copyToCacheDirectory: true,
    });

    if (resultado.canceled) return;

    setSubiendoTxt(true);
    try {
      const archivo = resultado.assets[0];
      const contenido = await FileSystem.readAsStringAsync(archivo.uri);
      const { hermanos: hermanosNuevos, errores } = parsearHermanosTxt(contenido);

      if (hermanosNuevos.length === 0) {
        Alert.alert('Archivo vacío o con formato incorrecto', errores.join('\n') || 'No se encontró ningún hermano.');
        return;
      }

      // Confirmación antes de reemplazar la lista actual
      Alert.alert(
        'Confirmar carga',
        `Se encontraron ${hermanosNuevos.length} hermanos en el archivo.\n` +
          (errores.length > 0 ? `⚠️ ${errores.length} línea(s) con error, serán ignoradas.\n` : '') +
          `\nEsto REEMPLAZARÁ la lista actual de hermanos de tu comunidad. ¿Continuar?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Sí, reemplazar',
            style: 'destructive',
            onPress: () => guardarHermanosEnFirestore(hermanosNuevos),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error al leer el archivo', error.message);
    } finally {
      setSubiendoTxt(false);
    }
  };

  const guardarHermanosEnFirestore = async (hermanosNuevos) => {
    try {
      const refHermanos = collection(db, 'comunidades', comunidadId, 'hermanos');

      // 1. Borrar la lista anterior
      const snapActual = await getDocs(refHermanos);
      const batchBorrado = writeBatch(db);
      snapActual.docs.forEach((d) => batchBorrado.delete(d.ref));
      await batchBorrado.commit();

      // 2. Escribir la lista nueva (en bloques de 500, límite de Firestore por batch)
      const bloques = [];
      for (let i = 0; i < hermanosNuevos.length; i += 450) {
        bloques.push(hermanosNuevos.slice(i, i + 450));
      }
      for (const bloque of bloques) {
        const batch = writeBatch(db);
        bloque.forEach((h) => {
          batch.set(doc(db, 'comunidades', comunidadId, 'hermanos', h.id), {
            nombre: h.nombre,
            telefono: h.telefono,
            parejaId: h.parejaId,
          });
        });
        await batch.commit();
      }

      Alert.alert('¡Listo!', 'La lista de hermanos se actualizó correctamente.');
      cargarDatos();
    } catch (error) {
      Alert.alert('Error al guardar', error.message);
    }
  };

  // --- Expulsar a un miembro -------------------------------------------
  const handleExpulsar = (miembro) => {
    Alert.alert(
      'Expulsar a esta persona',
      `${miembro.nombreMostrado || 'Esta persona'} perderá el acceso a la comunidad. ¿Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Expulsar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'comunidades', comunidadId, 'miembros', miembro.id));
              setMiembros((prev) => prev.filter((m) => m.id !== miembro.id));
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  if (cargandoDatos) {
    return (
      <View style={styles.cargandoContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.titulo}>🛠️ Panel del Responsable</Text>
      <Text style={styles.subtitulo}>{comunidad?.nombre}</Text>

      {/* Código de acceso */}
      <View style={styles.cardCodigo}>
        <Ionicons name="key" size={24} color="#FFFFFF" />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.cardCodigoLabel}>Código de tu comunidad</Text>
          <Text style={styles.cardCodigoValor}>{comunidad?.codigoAcceso}</Text>
        </View>
      </View>

      {/* Subir TXT */}
      <View style={styles.card}>
        <Text style={styles.cardTitulo}>👨‍👩‍👧‍👦 Lista de hermanos</Text>
        <Text style={styles.cardTexto}>
          {hermanos.length} hermano(s) cargado(s) actualmente.
        </Text>
        <TouchableOpacity style={styles.botonSubir} onPress={handleSubirTxt} disabled={subiendoTxt}>
          {subiendoTxt ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="document-text-outline" size={20} color="#FFFFFF" />
              <Text style={styles.botonSubirTexto}>Subir archivo .txt</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.ayudaFormato}>
          Formato: Nombre & Nombre (si es matrimonio) | Teléfono — una persona por línea.
        </Text>
      </View>

      {/* Lista de hermanos cargados */}
      {hermanos.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Hermanos actuales</Text>
          {hermanos.map((h) => (
            <View key={h.id} style={styles.filaHermano}>
              <Text style={styles.filaHermanoNombre}>{h.nombre}</Text>
              <Text style={styles.filaHermanoDato}>📞 {h.telefono || 'Sin teléfono'}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Miembros con acceso */}
      <View style={styles.card}>
        <Text style={styles.cardTitulo}>📱 Celulares con acceso ({miembros.length})</Text>
        {miembros.length === 0 && (
          <Text style={styles.cardTexto}>Todavía nadie se ha unido con tu código.</Text>
        )}
        {miembros.map((m) => (
          <View key={m.id} style={styles.filaMiembro}>
            <Text style={styles.filaMiembroNombre}>{m.nombreMostrado || 'Sin nombre'}</Text>
            <TouchableOpacity onPress={() => handleExpulsar(m)} style={styles.botonExpulsar}>
              <Ionicons name="person-remove-outline" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.botonSalir} onPress={salir}>
        <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
        <Text style={styles.botonSalirTexto}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  cargandoContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  scrollContent: { padding: 20, paddingBottom: 60 },
  titulo: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  subtitulo: { fontSize: 16, color: COLORS.textMuted, marginBottom: 20 },
  cardCodigo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  cardCodigoLabel: { fontSize: 13, color: '#D9D3F5', fontWeight: '600' },
  cardCodigoValor: { fontSize: 22, color: '#FFFFFF', fontWeight: '800', letterSpacing: 2 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitulo: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  cardTexto: { fontSize: 14, color: COLORS.textMuted, marginBottom: 12 },
  botonSubir: {
    flexDirection: 'row',
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonSubirTexto: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginLeft: 8 },
  ayudaFormato: { fontSize: 12, color: COLORS.textMuted, marginTop: 10, fontStyle: 'italic' },
  filaHermano: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filaHermanoNombre: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  filaHermanoDato: { fontSize: 13, color: COLORS.textMuted },
  filaMiembro: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filaMiembroNombre: { fontSize: 15, color: COLORS.text },
  botonExpulsar: { padding: 6 },
  botonSalir: {
    flexDirection: 'row',
    backgroundColor: COLORS.danger,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  botonSalirTexto: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginLeft: 8 },
});
