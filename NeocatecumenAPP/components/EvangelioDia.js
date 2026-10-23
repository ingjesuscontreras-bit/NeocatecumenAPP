import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { obtenerEvangelio, claveFecha } from '../utils/evangelio';
import { URL_LECTURAS } from '../utils/liturgia';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS, FONT, SOMBRA_TARJETA } from '../theme/layout';

export default function EvangelioDia({ fecha }) {
  const [datos, setDatos] = useState(null);
  const [estado, setEstado] = useState('cargando'); // cargando | listo | error
  const [abierto, setAbierto] = useState(false);
  const clave = claveFecha(fecha);

  const cargar = useCallback(async () => {
    setEstado('cargando');
    try {
      const resultado = await obtenerEvangelio(fecha);
      setDatos(resultado);
      setEstado('listo');
    } catch (error) {
      console.log('No se pudo cargar el Evangelio:', error?.message);
      setEstado('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const vistaPrevia = datos ? datos.texto.replace(/\s+/g, ' ') : '';

  return (
    <>
      <View style={styles.card}>
        <View style={styles.encabezado}>
          <Ionicons name="bookmark" size={22} color={COLORS.primary} />
          <Text style={styles.cardTitulo}>Evangelio del día</Text>
        </View>

        {estado === 'cargando' && <ActivityIndicator color={COLORS.primary} />}

        {estado === 'error' && (
          <>
            <Text style={styles.suave}>
              No pudimos cargar el Evangelio. Revisa tu conexión e inténtalo de nuevo.
            </Text>
            <View style={styles.filaBotones}>
              <TouchableOpacity style={styles.botonSecundario} onPress={cargar}>
                <Ionicons name="refresh" size={18} color={COLORS.primary} />
                <Text style={styles.botonSecundarioTexto}>Reintentar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.botonSecundario}
                onPress={() => Linking.openURL(URL_LECTURAS).catch(() => {})}
              >
                <Ionicons name="open-outline" size={18} color={COLORS.primary} />
                <Text style={styles.botonSecundarioTexto}>Ver en iBreviary</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {estado === 'listo' && datos && (
          <TouchableOpacity activeOpacity={0.8} onPress={() => setAbierto(true)}>
            {datos.titulo ? <Text style={styles.referencia}>{datos.titulo}</Text> : null}
            <Text style={styles.vistaPrevia} numberOfLines={4}>
              {vistaPrevia}
            </Text>
            <View style={styles.pista}>
              <Ionicons name="expand-outline" size={18} color={COLORS.primary} />
              <Text style={styles.pistaTexto}>Toca para leerlo completo</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Ventanita con el texto completo */}
      <Modal visible={abierto} animationType="slide" transparent onRequestClose={() => setAbierto(false)}>
        <View style={styles.fondo}>
          <View style={styles.hoja}>
            <View style={styles.hojaEncabezado}>
              <View style={{ flex: 1 }}>
                <Text style={styles.hojaEtiqueta}>EVANGELIO DEL DÍA</Text>
                {datos?.titulo ? <Text style={styles.hojaTitulo}>{datos.titulo}</Text> : null}
              </View>
              <TouchableOpacity
                style={styles.botonCerrar}
                onPress={() => setAbierto(false)}
                accessibilityLabel="Cerrar"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={26} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.hojaContenido}>
              <Text style={styles.hojaTexto}>{datos?.texto}</Text>
              <Text style={styles.credito}>Fuente: Evangelizo.org</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  encabezado: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  cardTitulo: { fontSize: FONT.subtitulo + 1, fontWeight: '800', color: COLORS.text, marginLeft: SPACING.sm },
  suave: { fontSize: FONT.pequeno, color: COLORS.textMuted, marginBottom: SPACING.sm },
  referencia: { fontSize: FONT.texto, fontWeight: '700', color: COLORS.primary, marginBottom: SPACING.xs },
  vistaPrevia: { fontSize: FONT.texto, color: COLORS.text, lineHeight: 23 },
  pista: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm },
  pistaTexto: { fontSize: FONT.pequeno, fontWeight: '700', color: COLORS.primary, marginLeft: SPACING.xs + 2 },
  filaBotones: { flexDirection: 'row', flexWrap: 'wrap' },
  botonSecundario: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.sm + 4,
    paddingHorizontal: SPACING.md - 2,
    marginRight: SPACING.sm,
    marginTop: SPACING.xs,
  },
  botonSecundarioTexto: { color: COLORS.primary, fontSize: FONT.pequeno, fontWeight: '700', marginLeft: SPACING.xs + 2 },
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  hoja: {
    maxHeight: '85%',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    ...SOMBRA_TARJETA,
  },
  hojaEncabezado: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  hojaEtiqueta: { fontSize: FONT.pequeno - 2, fontWeight: '700', letterSpacing: 1.5, color: COLORS.textMuted },
  hojaTitulo: { fontSize: FONT.subtitulo + 2, fontWeight: '800', color: COLORS.text, marginTop: 2 },
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
  credito: { fontSize: FONT.pequeno - 2, color: COLORS.textMuted, fontStyle: 'italic', marginTop: SPACING.md },
});
