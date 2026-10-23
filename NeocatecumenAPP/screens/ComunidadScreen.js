import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useComunidad } from '../context/ComunidadContext';
import { construirUnidades } from '../utils/sorteoAlgorithm';
import ContactarModal from '../components/ContactarModal';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS, FONT, SOMBRA_TARJETA } from '../theme/layout';

export default function ComunidadScreen() {
  const { comunidadId } = useComunidad();
  const [busqueda, setBusqueda] = useState('');
  const [hermanos, setHermanos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [contacto, setContacto] = useState(null);

  const cargarHermanos = useCallback(async () => {
    if (!comunidadId) return;
    try {
      const snap = await getDocs(collection(db, 'comunidades', comunidadId, 'hermanos'));
      setHermanos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.log('Error cargando hermanos:', error);
    } finally {
      setCargando(false);
    }
  }, [comunidadId]);

  // Se actualiza cada vez que entras a la pestaña
  useFocusEffect(
    useCallback(() => {
      cargarHermanos();
    }, [cargarHermanos])
  );

  const unidades = useMemo(() => construirUnidades(hermanos), [hermanos]);

  const unidadesFiltradas = useMemo(() => {
    if (!busqueda.trim()) return unidades;
    const textoBusqueda = busqueda.toLowerCase();
    return unidades.filter((u) => u.etiqueta.toLowerCase().includes(textoBusqueda));
  }, [busqueda, unidades]);

  if (cargando) {
    return (
      <View style={styles.cargandoContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.titulo}>🤝 Comunidad</Text>
        <Text style={styles.subtitulo}>
          {unidades.length} unidades familiares · {hermanos.length} hermanos
        </Text>

        <View style={styles.buscador}>
          <Ionicons name="search" size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.buscadorInput}
            placeholder="Buscar por nombre..."
            placeholderTextColor={COLORS.textMuted}
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>

        {hermanos.length === 0 && (
          <Text style={styles.sinResultados}>
            Tu responsable todavía no ha subido la lista de hermanos.
          </Text>
        )}

        {unidadesFiltradas.map((unidad) => (
          <View key={unidad.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons
                name={unidad.tipo === 'matrimonio' ? 'heart' : 'person'}
                size={22}
                color={COLORS.primary}
              />
              <Text style={styles.cardTitulo}>{unidad.etiqueta}</Text>
            </View>

            {unidad.miembros.map((persona) => (
              <View key={persona.id} style={styles.filaMiembro}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.filaMiembroNombre}>{persona.nombre}</Text>
                  {persona.telefono ? (
                    <Text style={styles.filaMiembroDato}>📞 {persona.telefono}</Text>
                  ) : null}
                </View>

                {persona.telefono ? (
                  <TouchableOpacity
                    style={styles.botonContactar}
                    onPress={() => setContacto(persona)}
                    activeOpacity={0.8}
                    accessibilityLabel={`Contactar a ${persona.nombre}`}
                  >
                    <Ionicons name="call" size={18} color="#FFFFFF" />
                    <Text style={styles.botonContactarTexto}>Contactar</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </View>
        ))}

        {hermanos.length > 0 && unidadesFiltradas.length === 0 && (
          <Text style={styles.sinResultados}>No se encontraron hermanos con ese nombre.</Text>
        )}
      </ScrollView>

      <ContactarModal persona={contacto} onCerrar={() => setContacto(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  cargandoContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.lg - 4, paddingBottom: SPACING.xl + 28 },
  titulo: { fontSize: FONT.titulo, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.xs },
  subtitulo: { fontSize: FONT.subtitulo - 2, color: COLORS.textMuted, marginBottom: SPACING.md + 2 },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.sm + 4,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md - 2,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.lg - 2,
  },
  buscadorInput: { flex: 1, fontSize: FONT.texto, color: COLORS.text, marginLeft: SPACING.sm, paddingVertical: SPACING.sm + 2 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md - 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SOMBRA_TARJETA,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.sm,
  },
  cardTitulo: { fontSize: FONT.subtitulo, fontWeight: '700', color: COLORS.text, marginLeft: SPACING.sm, flex: 1 },
  filaMiembro: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  filaMiembroNombre: { fontSize: FONT.texto, fontWeight: '600', color: COLORS.text },
  filaMiembroDato: { fontSize: FONT.pequeno, color: COLORS.textMuted },
  botonContactar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm + 4,
    paddingHorizontal: SPACING.md - 2,
    marginLeft: SPACING.sm,
  },
  botonContactarTexto: { color: '#FFFFFF', fontSize: FONT.pequeno, fontWeight: '700', marginLeft: SPACING.xs + 2 },
  sinResultados: { fontSize: FONT.texto, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xl - 2 },
});
