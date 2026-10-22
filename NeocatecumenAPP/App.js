import React, { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { ComunidadProvider, useComunidad } from './context/ComunidadContext';
import { COLORS } from './theme/colors';
import BienvenidaScreen from './screens/BienvenidaScreen';
import UnirseScreen from './screens/UnirseScreen';
import AdminAccesoScreen from './screens/AdminAccesoScreen';
import InicioScreen from './screens/InicioScreen';
import ComunidadScreen from './screens/ComunidadScreen';
import TombolaScreen from './screens/TombolaScreen';
import LiturgiaScreen from './screens/LiturgiaScreen';
import AdminScreen from './screens/AdminScreen';

const Tab = createBottomTabNavigator();

const ICONOS = {
  Inicio: { activo: 'home', inactivo: 'home-outline' },
  Comunidad: { activo: 'people', inactivo: 'people-outline' },
  Tómbola: { activo: 'gift', inactivo: 'gift-outline' },
  Liturgia: { activo: 'book', inactivo: 'book-outline' },
  Admin: { activo: 'settings', inactivo: 'settings-outline' },
};

// Envuelve una pantalla para respetar el espacio seguro de arriba (notch)
function conEspacioSeguro(ComponentePantalla) {
  return function PantallaEnvuelta(props) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ComponentePantalla {...props} />
      </SafeAreaView>
    );
  };
}

const InicioConEspacio = conEspacioSeguro(InicioScreen);
const ComunidadConEspacio = conEspacioSeguro(ComunidadScreen);
const TombolaConEspacio = conEspacioSeguro(TombolaScreen);
const LiturgiaConEspacio = conEspacioSeguro(LiturgiaScreen);
const AdminConEspacio = conEspacioSeguro(AdminScreen);

function AppTabs({ esAdmin }) {
  return (
    <Tab.Navigator
      initialRouteName="Inicio"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#9089B8',
        tabBarStyle: { height: 78, paddingBottom: 12, paddingTop: 8 },
        tabBarLabelStyle: { fontSize: 13, fontWeight: '700' },
        tabBarIcon: ({ focused, color, size }) => {
          const nombreIcono = focused ? ICONOS[route.name].activo : ICONOS[route.name].inactivo;
          return <Ionicons name={nombreIcono} size={size + 4} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={InicioConEspacio} />
      <Tab.Screen name="Comunidad" component={ComunidadConEspacio} />
      <Tab.Screen name="Tómbola" component={TombolaConEspacio} />
      <Tab.Screen name="Liturgia" component={LiturgiaConEspacio} />
      {esAdmin && <Tab.Screen name="Admin" component={AdminConEspacio} />}
    </Tab.Navigator>
  );
}

function Portero() {
  const { modo, cargando } = useComunidad();
  // Siempre arranca en 'bienvenida'
  const [pantalla, setPantalla] = useState('bienvenida');

  const volverABienvenida = () => setPantalla('bienvenida');

  // Botón físico "atrás" de Android: vuelve a Bienvenida si estás en otra pantalla
  useEffect(() => {
    const suscripcion = BackHandler.addEventListener('hardwareBackPress', () => {
      if (pantalla !== 'bienvenida') {
        setPantalla('bienvenida');
        return true;
      }
      return false;
    });
    return () => suscripcion.remove();
  }, [pantalla]);

  if (cargando) {
    return (
      <SafeAreaView style={styles.cargandoContainer} edges={['top']}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (modo === 'admin') return <AppTabs esAdmin />;
  if (modo === 'miembro') return <AppTabs esAdmin={false} />;

  if (pantalla === 'unirse') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <UnirseScreen onVolver={volverABienvenida} />
      </SafeAreaView>
    );
  }

  if (pantalla === 'adminAcceso') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <AdminAccesoScreen onVolver={volverABienvenida} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <BienvenidaScreen
        onElegirMiembro={() => setPantalla('unirse')}
        onElegirAdmin={() => setPantalla('adminAcceso')}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ComunidadProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <Portero />
        </NavigationContainer>
      </ComunidadProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  cargandoContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
});
