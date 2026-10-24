/**
 * firebase/config.js
 * Conexión con Firebase. La sesión se guarda en el teléfono (AsyncStorage).
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import * as AsyncStorageModule from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCaCuGAKpANrkG5zuwVMQH9gcJ76in4A0s",
  authDomain: "neocatecumenapp.firebaseapp.com",
  projectId: "neocatecumenapp",
  storageBucket: "neocatecumenapp.firebasestorage.app",
  messagingSenderId: "461425532988",
  appId: "1:461425532988:web:6673957d55b36f69502339",
};

// Compatible con las dos versiones de AsyncStorage (v2 y v3)
const almacenamiento = AsyncStorageModule.createAsyncStorage
  ? AsyncStorageModule.createAsyncStorage('firebase-auth')
  : AsyncStorageModule.default;

let app;
let auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, { persistence: getReactNativePersistence(almacenamiento) });
} else {
  // Al recargar la app en desarrollo, reutiliza lo ya iniciado
  app = getApp();
  auth = getAuth(app);
}

const db = getFirestore(app);

export { auth, db };
