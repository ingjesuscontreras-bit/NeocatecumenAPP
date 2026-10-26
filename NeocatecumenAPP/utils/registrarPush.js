import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Cómo se muestra una notificación si llega con la app abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Pide permiso, obtiene la "dirección" de este celular y la guarda en la ficha
 * del hermano. Nunca lanza errores: si algo falla, la app sigue normal.
 */
export async function registrarPush(comunidadId, uid) {
  try {
    if (Platform.OS !== 'android') return null; // iPhone: más adelante

    await Notifications.setNotificationChannelAsync('default', {
      name: 'Avisos de la comunidad',
      importance: Notifications.AndroidImportance.HIGH,
    });

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

    await updateDoc(doc(db, 'comunidades', comunidadId, 'miembros', uid), { pushToken: token });
    return token;
  } catch (error) {
    console.log('registrarPush:', error?.message || error);
    return null;
  }
}
