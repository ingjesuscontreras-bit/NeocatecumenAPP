/**
 * firebase/config.js
 * Inicializa la conexión con Firebase (Auth, Firestore, Storage).
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCaCuGAKpANrkG5zuwVMQH9gcJ76in4A0s",
  authDomain: "neocatecumenapp.firebaseapp.com",
  projectId: "neocatecumenapp",
  storageBucket: "neocatecumenapp.firebasestorage.app",
  messagingSenderId: "461425532988",
  appId: "1:461425532988:web:6673957d55b36f69502339",
};

// Evita el error de "Firebase App already initialized" al recargar la app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
