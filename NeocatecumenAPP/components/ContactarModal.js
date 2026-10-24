import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { numeroParaMarcar, numeroParaWhatsApp } from '../utils/telefono';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS, FONT, SOMBRA_TARJETA } from '../theme/layout';

export default function ContactarModal({ persona, onCerrar }) {
  const insets = useSafeAreaInsets();
  const visible = !!persona;
  const telefono = persona?.telefono || '';
  const marcable = numeroParaMarcar(telefono);
  const whatsapp = numeroParaWhatsApp(telefono);

  const abrir = async (url, nombreApp) => {
    try {
      await Linking.openURL(url);
      onCerrar();
    } catch (error) {
      Alert.alert(`No se pudo abrir ${nombreApp}`, 'Revisa que tu teléfono pueda hacerlo.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      <View style={styles.fondo}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onCerrar} />

        <View style={[styles.hoja, { paddingBottom: SPACING.xl + insets.bottom }]}>
          <Text style={styles.nombre}>{persona?.nombre}</Text>
          <Text style={styles.telefono}>📞 {telefono}</Text>

          {marcable ? (
            <>
              <TouchableOpacity
                style={[styles.opcion, { backgroundColor: COLORS.primary }]}
                onPress={() => abrir(`tel:${marcable}`, 'el teléfono')}
                activeOpacity={0.85}
              >
                <Ionicons name="call" size={24} color="#FFFFFF" />
                <Text style={styles.opcionTexto}>Llamar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.opcion, { backgroundColor: COLORS.accent }]}
                onPress={() => abrir(`sms:${marcable}`, 'los mensajes')}
                activeOpacity={0.85}
              >
                <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
                <Text style={styles.opcionTexto}>Mensaje de texto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.opcion, { backgroundColor: COLORS.success }]}
                onPress={() => abrir(`https://wa.me/${whatsapp}`, 'WhatsApp')}
                activeOpacity={0.85}
              >
                <Ionicons name="logo-whatsapp" size={24} color="#FFFFFF" />
                <Text style={styles.opcionTexto}>WhatsApp</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.invalido}>
              El número guardado no parece válido. Pide a tu responsable que lo corrija.
            </Text>
          )}

          <TouchableOpacity style={styles.cancelar} onPress={onCerrar}>
            <Text style={styles.cancelarTexto}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  hoja: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.lg + 6,
    borderTopRightRadius: RADIUS.lg + 6,
    padding: SPACING.lg - 4,
    paddingBottom: SPACING.xl,
    ...SOMBRA_TARJETA,
  },
  nombre: { fontSize: FONT.titulo - 4, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  telefono: { fontSize: FONT.texto, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xs, marginBottom: SPACING.md },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 58,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm + 2,
  },
  opcionTexto: { color: '#FFFFFF', fontSize: FONT.subtitulo + 1, fontWeight: '800', marginLeft: SPACING.sm + 2 },
  invalido: { fontSize: FONT.texto, color: COLORS.danger, textAlign: 'center', marginVertical: SPACING.md },
  cancelar: { alignItems: 'center', justifyContent: 'center', minHeight: 52, marginTop: SPACING.xs },
  cancelarTexto: { fontSize: FONT.subtitulo, fontWeight: '700', color: COLORS.textMuted },
});
