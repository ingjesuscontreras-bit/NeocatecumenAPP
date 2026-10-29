import React, { useCallback, useState } from 'react';
import { View, TouchableOpacity, ScrollView, Modal, StyleSheet, Linking, Alert } from 'react-native';
import Text from './TextoEscalable';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useComunidad } from '../context/ComunidadContext';
import { vigentes } from '../utils/avisos';
import { textoFecha } from '../utils/eventos';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS, FONT, SOMBRA_TARJETA } from '../theme/layout';

export default function AvisosComunidad({ refresco = 0 }) {
  const { comunidadId } = useComunidad();
  const [avisos, setAvisos] = useState([]);
  const [abierto, setAbierto] = useState(null);

  const cargar = useCallback(async () => {
    if (!comunidadId) return;
    try {
      const snap = await getDocs(collection(db, 'comunidades', comunidadId, 'avisos'));
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAvisos(vigentes(lista));
    } catch (error) {
      console.log('Error cargando avisos:', error);
    }
  }, [comunidadId]);

  // Se recarga al entrar a la pestaña y cuando Inicio se refresca
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar, refresco])
  );

  const abrirEnlace = async (url) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('No se pudo abrir el enlace', 'Revisa tu conexión e inténtalo de nuevo.');
    }
  };

  if (avisos.length === 0 && !abierto) return null;

  return (
    <>
      <Text style={styles.tituloSeccion}>📢 Avisos importantes</Text>

      {avisos.map((a) => (
        <TouchableOpacity key={a.id} style={styles.card} activeOpacity={0.8} onPress={() => setAbierto(a)}>
          <Text style={styles.cardTitulo}>{a.titulo}</Text>
          <Text style={styles.cardTexto} numberOfLines={3}>
            {a.mensaje}
          </Text>
          <View style={styles.pista}>
            <Ionicons name="expand-outline" size={18} color={COLORS.accent} />
            <Text style={styles.pistaTexto}>Toca para leerlo completo</Text>
          </View>
        </TouchableOpacity>
      ))}

      <Modal visible={!!abierto} animationType="slide" transparent onRequestClose={() => setAbierto(null)}>
        <View style={styles.fondo}>
          <View style={styles.hoja}>
            <View style={styles.hojaEncabezado}>
              <View style={{ flex: 1 }}>
                <Text style={styles.hojaEtiqueta}>AVISO</Text>
                <Text style={styles.hojaTitulo}>{abierto?.titulo}</Text>
                {abierto?.creadoEn ? (
                  <Text style={styles.hojaFecha}>Publicado el {textoFecha(new Date(abierto.creadoEn))}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={styles.botonCerrar}
                onPress={() => setAbierto(null)}
                accessibilityLabel="Cerrar"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={26} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.hojaContenido}>
              <Text style={styles.hojaTexto}>{abierto?.mensaje}</Text>

              {abierto?.enlace ? (
                <TouchableOpacity style={styles.botonEnlace} onPress={() => abrirEnlace(abierto.enlace)}>
                  <Ionicons name="open-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.botonEnlaceTexto}>Abrir enlace</Text>
                </TouchableOpacity>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  tituloSeccion: { fontSize: FONT.subtitulo + 3, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.sm + 2 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.accent,
    ...SOMBRA_TARJETA,
  },
  cardTitulo: { fontSize: FONT.subtitulo, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs },
  cardTexto: { fontSize: FONT.texto - 1, color: COLORS.textMuted, lineHeight: 22 },
  pista: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm },
  pistaTexto: { fontSize: FONT.pequeno, fontWeight: '700', color: COLORS.accent, marginLeft: SPACING.xs + 2 },
  fondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: SPACING.md },
  hoja: { maxHeight: '85%', backgroundColor: COLORS.card, borderRadius: RADIUS.lg, ...SOMBRA_TARJETA },
  hojaEncabezado: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  hojaEtiqueta: { fontSize: FONT.pequeno - 2, fontWeight: '700', letterSpacing: 1.5, color: COLORS.accent },
  hojaTitulo: { fontSize: FONT.subtitulo + 2, fontWeight: '800', color: COLORS.text, marginTop: 2 },
  hojaFecha: { fontSize: FONT.pequeno - 1, color: COLORS.textMuted, marginTop: 2 },
  botonCerrar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  hojaContenido: { padding: SPACING.md },
  hojaTexto: { fontSize: FONT.subtitulo + 1, color: COLORS.text, lineHeight: 28 },
  botonEnlace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg - 4,
  },
  botonEnlaceTexto: { color: '#FFFFFF', fontSize: FONT.subtitulo, fontWeight: '800', marginLeft: SPACING.sm },
});
