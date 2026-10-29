import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const TAMANOS = [
  { id: 'normal', factor: 1 },
  { id: 'mediana', factor: 1.15 },
  { id: 'grande', factor: 1.3 },
];

const CLAVE = 'neocatecumenapp:tamanoLetra';
const TamanoLetraContext = createContext({ tamano: 'normal', factor: 1, cambiarTamano: () => {} });

export function TamanoLetraProvider({ children }) {
  const [tamano, setTamano] = useState('normal');

  // Al abrir la app, recupera el tamaño que eligió esta persona
  useEffect(() => {
    AsyncStorage.getItem(CLAVE)
      .then((valor) => {
        if (valor && TAMANOS.some((t) => t.id === valor)) setTamano(valor);
      })
      .catch(() => {});
  }, []);

  const cambiarTamano = (id) => {
    setTamano(id);
    AsyncStorage.setItem(CLAVE, id).catch(() => {});
  };

  const factor = (TAMANOS.find((t) => t.id === tamano) || TAMANOS[0]).factor;

  return (
    <TamanoLetraContext.Provider value={{ tamano, factor, cambiarTamano }}>
      {children}
    </TamanoLetraContext.Provider>
  );
}

export const useTamanoLetra = () => useContext(TamanoLetraContext);
