/**
 * context/ComunidadContext.js
 * -----------------------------------------------------------------------
 * Maneja el estado global de acceso a la app. Hay 3 estados posibles:
 *  - modo: null          → todavía no se decidió nada, mostrar Bienvenida
 *  - modo: 'admin'       → sesión de Responsable (Firebase Auth real)
 *  - modo: 'miembro'     → celular unido a una comunidad vía código
 * -----------------------------------------------------------------------
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { generarCodigoAcceso } from '../utils/generarCodigo';

const ComunidadContext = createContext(null);
const CLAVE_STORAGE = 'neocatecumenapp:comunidadId';

export function ComunidadProvider({ children }) {
  const [modo, setModo] = useState(null); // null | 'admin' | 'miembro'
  const [comunidadId, setComunidadId] = useState(null);
  const [comunidad, setComunidad] = useState(null); // datos del documento
  const [cargando, setCargando] = useState(true);

  // Al abrir la app: revisamos si ya había una comunidad guardada en este celular
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCargando(false);
        return;
      }

      // Caso 1: el usuario tiene correo/contraseña → es un Admin/Responsable
      if (user.email) {
        const refComunidad = doc(db, 'comunidades', user.uid === user.uid ? user.uid : '');
        // Buscamos la comunidad cuyo adminUid sea este usuario
        const q = query(collection(db, 'comunidades'), where('adminUid', '==', user.uid));
        const resultados = await getDocs(q);
        if (!resultados.empty) {
          const docComunidad = resultados.docs[0];
          setComunidadId(docComunidad.id);
          setComunidad(docComunidad.data());
          setModo('admin');
        }
        setCargando(false);
        return;
      }

      // Caso 2: sesión anónima → es un miembro, revisamos si ya tiene comunidad guardada
      const idGuardado = await AsyncStorage.getItem(CLAVE_STORAGE);
      if (idGuardado) {
        const refMiembro = doc(db, 'comunidades', idGuardado, 'miembros', user.uid);
        const snapMiembro = await getDoc(refMiembro);
        if (snapMiembro.exists()) {
          const refComunidad = doc(db, 'comunidades', idGuardado);
          const snapComunidad = await getDoc(refComunidad);
          if (snapComunidad.exists()) {
            setComunidadId(idGuardado);
            setComunidad(snapComunidad.data());
            setModo('miembro');
          }
        } else {
          // El admin lo expulsó, o el documento ya no existe: limpiamos
          await AsyncStorage.removeItem(CLAVE_STORAGE);
        }
      }
      setCargando(false);
    });

    return unsubscribe;
  }, []);

  /**
   * Crea una comunidad nueva + la cuenta del responsable.
   */
  const crearComunidad = async (nombreComunidad, email, password) => {
    const credenciales = await createUserWithEmailAndPassword(auth, email, password);
    const codigo = generarCodigoAcceso();
    const refNuevaComunidad = doc(collection(db, 'comunidades'));
    await setDoc(refNuevaComunidad, {
      nombre: nombreComunidad,
      codigoAcceso: codigo,
      adminUid: credenciales.user.uid,
    });
    setComunidadId(refNuevaComunidad.id);
    setComunidad({ nombre: nombreComunidad, codigoAcceso: codigo, adminUid: credenciales.user.uid });
    setModo('admin');
    return codigo;
  };

  const loginAdmin = (email, password) => signInWithEmailAndPassword(auth, email, password);

  /**
   * Un hermano se une a una comunidad usando el código de acceso.
   */
  const unirseConCodigo = async (codigoIngresado, nombreMostrado) => {
    const codigoLimpio = codigoIngresado.trim().toUpperCase();
    const q = query(collection(db, 'comunidades'), where('codigoAcceso', '==', codigoLimpio));
    const resultados = await getDocs(q);

    if (resultados.empty) {
      throw new Error('Código inválido. Verifica con tu responsable que esté bien escrito.');
    }

    const docComunidad = resultados.docs[0];
    const credenciales = await signInAnonymously(auth);

    await setDoc(doc(db, 'comunidades', docComunidad.id, 'miembros', credenciales.user.uid), {
      nombreMostrado: nombreMostrado || 'Hermano/a',
      fechaUnion: new Date().toISOString(),
    });

    await AsyncStorage.setItem(CLAVE_STORAGE, docComunidad.id);
    setComunidadId(docComunidad.id);
    setComunidad(docComunidad.data());
    setModo('miembro');
  };

  const salir = async () => {
    await AsyncStorage.removeItem(CLAVE_STORAGE);
    await signOut(auth);
    setModo(null);
    setComunidadId(null);
    setComunidad(null);
  };

  return (
    <ComunidadContext.Provider
      value={{
        modo,
        comunidadId,
        comunidad,
        cargando,
        crearComunidad,
        loginAdmin,
        unirseConCodigo,
        salir,
      }}
    >
      {children}
    </ComunidadContext.Provider>
  );
}

export function useComunidad() {
  return useContext(ComunidadContext);
}
