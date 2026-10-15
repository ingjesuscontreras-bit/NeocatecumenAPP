import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { ComunidadProvider, useComunidad } from './context/ComunidadContext';
import BienvenidaScreen from './screens/BienvenidaScreen';
import UnirseScreen from './screens/UnirseScreen';
import AdminAccesoScreen from './screens/AdminAccesoScreen';
import InicioScreen from './screens/InicioScreen';
import ComunidadScreen from './screens/ComunidadScreen';
import TombolaScreen from './screens/TombolaScreen';
import LiturgiaScreen from './screens/LiturgiaScreen';

const Tab = createBottomTabNavigator();

const ICONOS = {
  Inicio: { activo: 'home', inactivo: 'home-outline' },
  Comunidad: { activo: 'people', inactivo: 'people-outline' },
  Tómbola: { activo: 'gift', inactivo: 'gift-outline' },
  Liturgia: { activo: 'book', inactivo: 'book-outline' },
};

function AppTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Inicio"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#4C3AAE',
        tabBarInactiveTintColor: '#9089B8',
        tabBarStyle: { height: 78, paddingBottom: 12, paddingTop: 8 },
        tabBarLabelStyle: { fontSize: 13, fontWeight: '700' },
        tabBarIcon: ({ focused, color, size }) => {
          const nombreIcono = focused ? ICONOS[route.name].activo : ICONOS[route.name].inactivo;
          return <Ionicons name={nombreIcono} size={size + 4} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={InicioScreen} />
      <Tab.Screen name="Comunidad" component={ComunidadScreen} />
      <Tab.Screen name="Tómbola" component={TombolaScreen} />
      <Tab.Screen name="Liturgia" component={LiturgiaScreen} />
    </Tab.Navigator>
  );
}

function Portero() {
  const { modo, cargando } = useComunidad();
  const [pantalla, setPantalla] = useState('bienvenida'); // 'bienvenida' | 'unirse' | 'adminAcceso'

  if (cargando) {
    return (
      <View style={styles.cargandoContainer}>
        <ActivityIndicator size="large" color="#4C3AAE" />
      </View>
    );
  }

  // Ya hay sesión activa (admin o miembro) → mostrar la app normal
  // NOTA: aquí falta diferenciar Admin (verá su panel) de Miembro (verá las tabs) —
  // lo resolvemos en el próximo paso cuando construyamos el AdminScreen real.
  if (modo === 'admin' || modo === 'miembro') {
    return <AppTabs />;
  }

  if (pantalla === 'unirse') {
    return <UnirseScreen onVolver={() => setPantalla('bienvenida')} />;
  }
  if (pantalla === 'adminAcceso') {
    return <AdminAccesoScreen onVolver={() => setPantalla('bienvenida')} />;
  }
  return (
    <BienvenidaScreen
      onElegirMiembro={() => setPantalla('unirse')}
      onElegirAdmin={() => setPantalla('adminAcceso')}
    />
  );
}

export default function App() {
  return (
    <ComunidadProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Portero />
      </NavigationContainer>
    </ComunidadProvider>
  );
}

const styles = StyleSheet.create({
  cargandoContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F4FB' },
});