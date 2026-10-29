import React from 'react';
import { View, Text as TextoRN, TouchableOpacity, StyleSheet } from 'react-native';
import { useTamanoLetra, TAMANOS } from '../context/TamanoLetraContext';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/layout';

const MUESTRA = { normal: 16, mediana: 21, grande: 27 };
const NOMBRE = { normal: 'normal', mediana: 'mediana', grande: 'grande' };

export default function SelectorTamanoLetra() {
  const { tamano, cambiarTamano } = useTamanoLetra();

  return (
    <View style={styles.caja}>
      <TextoRN style={styles.etiqueta}>Tamaño de letra</TextoRN>
      <View style={styles.fila}>
        {TAMANOS.map((t) => {
          const activo = t.id === tamano;
          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.boton, activo && styles.botonActivo]}
              onPress={() => cambiarTamano(t.id)}
              accessibilityRole="button"
              accessibilityLabel={`Letra ${NOMBRE[t.id]}`}
              accessibilityState={{ selected: activo }}
            >
              <TextoRN
                allowFontScaling={false}
                style={[styles.letra, { fontSize: MUESTRA[t.id] }, activo && styles.letraActiva]}
              >
                A
              </TextoRN>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  caja: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
  },
  etiqueta: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  fila: { flexDirection: 'row' },
  boton: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  botonActivo: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  letra: { fontWeight: '800', color: COLORS.primary },
  letraActiva: { color: '#FFFFFF' },
});
