import React from 'react';
import { View, Text as TextoRN, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from './TextoEscalable';
import { useComunidad } from '../context/ComunidadContext';
import { COLORS } from '../theme/colors';

const ICONOS = {
  Inicio: { activo: 'home', inactivo: 'home-outline' },
  Comunidad: { activo: 'people', inactivo: 'people-outline' },
  Noticias: { activo: 'newspaper', inactivo: 'newspaper-outline' },
  Liturgia: { activo: 'book', inactivo: 'book-outline' },
  Admin: { activo: 'settings', inactivo: 'settings-outline' },
};

// Menú morado a la izquierda: reemplaza la barra de abajo en pantallas anchas (web)
export default function MenuLateral({ state, descriptors, navigation }) {
  const { comunidad } = useComunidad();

  return (
    <View style={styles.menu}>
      <View style={styles.marca}>
        <View style={styles.logo}>
          <TextoRN style={styles.logoTexto}>✝️</TextoRN>
        </View>
        <Text style={styles.nombreApp}>NeocatecumenAPP</Text>
        {comunidad?.nombre ? (
          <Text style={styles.nombreComunidad} numberOfLines={2}>
            {comunidad.nombre}
          </Text>
        ) : null}
      </View>

      {state.routes.map((route, index) => {
        const enfocada = state.index === index;
        const { options } = descriptors[route.key];
        const etiqueta = options.title ?? route.name;
        const icono = ICONOS[route.name] || { activo: 'ellipse', inactivo: 'ellipse-outline' };

        const alPresionar = () => {
          const evento = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!enfocada && !evento.defaultPrevented) navigation.navigate(route.name, route.params);
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={alPresionar}
            style={[styles.item, enfocada && styles.itemActivo]}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: enfocada }}
            accessibilityLabel={etiqueta}
          >
            <Ionicons
              name={enfocada ? icono.activo : icono.inactivo}
              size={22}
              color={enfocada ? COLORS.primary : '#E3DDFB'}
            />
            <Text style={[styles.itemTexto, enfocada && styles.itemTextoActivo]}>{etiqueta}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    width: 250,
    backgroundColor: COLORS.primary,
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  marca: { marginBottom: 28, paddingHorizontal: 4 },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoTexto: { fontSize: 24 },
  nombreApp: { color: '#FFFFFF', fontSize: 19, fontWeight: '800' },
  nombreComunidad: { color: '#C9C0F2', fontSize: 13, marginTop: 3, lineHeight: 18 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
  },
  itemActivo: { backgroundColor: '#FFFFFF' },
  itemTexto: { marginLeft: 12, fontSize: 16, fontWeight: '700', color: '#E3DDFB' },
  itemTextoActivo: { color: COLORS.primary },
});
