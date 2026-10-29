import React from 'react';
import { Text as TextoRN, StyleSheet } from 'react-native';
import { useTamanoLetra } from '../context/TamanoLetraContext';

// Igual que el Text normal, pero agranda la letra según lo que eligió cada persona.
export default function Text({ style, ...props }) {
  const { factor } = useTamanoLetra();
  if (factor === 1) return <TextoRN style={style} {...props} />;

  const plano = StyleSheet.flatten(style) || {};
  if (!plano.fontSize) return <TextoRN style={style} {...props} />;

  const ajuste = { fontSize: Math.round(plano.fontSize * factor) };
  if (plano.lineHeight) ajuste.lineHeight = Math.round(plano.lineHeight * factor);
  return <TextoRN style={[style, ajuste]} {...props} />;
}
