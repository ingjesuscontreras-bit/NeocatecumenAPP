import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

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

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        initialRouteName="Inicio"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#4C3AAE',
          tabBarInactiveTintColor: '#9089B8',
          tabBarStyle: {
            height: 78,
            paddingBottom: 12,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 13,
            fontWeight: '700',
          },
          tabBarIcon: ({ focused, color, size }) => {
            const nombreIcono = focused
              ? ICONOS[route.name].activo
              : ICONOS[route.name].inactivo;
            return <Ionicons name={nombreIcono} size={size + 4} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Inicio" component={InicioScreen} />
        <Tab.Screen name="Comunidad" component={ComunidadScreen} />
        <Tab.Screen name="Tómbola" component={TombolaScreen} />
        <Tab.Screen name="Liturgia" component={LiturgiaScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}