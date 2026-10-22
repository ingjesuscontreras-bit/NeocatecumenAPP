/**
 * context/ComunidadContext.js
 * -----------------------------------------------------------------------
 * Estado global de acceso. Modos posibles:
 *  - null       → mostrar Bienvenida
 *  - 'admin'    → Responsable (correo y contraseña)
 *  - 'miembro'  → celular unido a una comunidad con el código
 *
 * Códigos de acceso: viven en la colección "codigos" (id = el código).
 * Esa colección no se puede listar; solo consultar un código que ya sabes.
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
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
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
  const [modo, setModo] = useState(null);
  const [comunidadId, setComunidadId] = useState(null);
  const [comunidad, setComunidad] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Al abrir la app: restaura la sesión guardada en el teléfono
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) return;

        // Responsable: tiene correo
        if (user.email) {
          const q = query(collection(db, 'comunidades'), where('adminUid', '==', user.uid));
          const resultados = await getDocs(q);
          if (!resultados.empty) {
            const docComunidad = resultados.docs[0];
            setComunidadId(docComunidad.id);
            setComunidad(docComunidad.data());
            setModo('admin');
          }
          return;
        }

        // Miembro: sesión anónima + comunidad guardada
        const idGuardado = await AsyncStorage.getItem(CLAVE_STORAGE);
        if (idGuardado) {
          const snapMiembro = await getDoc(doc(db, 'comunidades', idGuardado, 'miembros', user.uid));
          if (snapMiembro.exists()) {
            const snapComunidad = await getDoc(doc(db, 'comunidades', idGuardado));
            if (snapComunidad.exists()) {
              setComunidadId(idGuardado);
              setComunidad(snapComunidad.data());
              setModo('miembro');
            }
          } else {
            // El responsable lo expulsó: limpiamos
            await AsyncStorage.removeItem(CLAVE_STORAGE);
          }
        }
      } catch (error) {
        console.log('Error al restaurar la sesión:', error);
      } finally {
        setCargando(false);
      }
    });

    return unsubscribe;
  }, []);

  /** Crea la comunidad + la cuenta del responsable + su código de acceso. */
  const crearComunidad = async (nombreComunidad, email, password) => {
    const credenciales = await createUserWithEmailAndPassword(auth, email, password);
    const uid = credenciales.user.uid;
    const codigo = generarCodigoAcceso();

    const refNueva = doc(collection(db, 'comunidades'));
    await setDoc(refNueva, { nombre: nombreComunidad, codigoAcceso: codigo, adminUid: uid });
    await setDoc(doc(db, 'codigos', codigo), { comunidadId: refNueva.id, adminUid: uid });

    setComunidadId(refNueva.id);
    setComunidad({ nombre: nombreComunidad, codigoAcceso: codigo, adminUid: uid });
    setModo('admin');
    return codigo;
  };

  const loginAdmin = (email, password) => signInWithEmailAndPassword(auth, email, password);

  const recuperarContrasena = (email) => sendPasswordResetEmail(auth, email);

  /**
   * Cambia el código de acceso. Los miembros que ya están dentro siguen con
   * acceso; el código anterior deja de servir para entrar (útil tras expulsar).
   */
  const regenerarCodigo = async () => {
    const codigoViejo = comunidad?.codigoAcceso;
    const codigoNuevo = generarCodigoAcceso();
    const uid = auth.currentUser.uid;

    await setDoc(doc(db, 'codigos', codigoNuevo), { comunidadId, adminUid: uid });
    await updateDoc(doc(db, 'comunidades', comunidadId), { codigoAcceso: codigoNuevo });

    if (codigoViejo) {
      try {
        await deleteDoc(doc(db, 'codigos', codigoViejo));
      } catch (error) {
        // Puede no existir si la comunidad es anterior a este cambio
        console.log('Código anterior no encontrado:', error?.code);
      }
    }

    setComunidad((prev) => ({ ...prev, codigoAcceso: codigoNuevo }));
    return codigoNuevo;
  };

  /** Un hermano se une usando el código. */
  const unirseConCodigo = async (codigoIngresado, nombreMostrado) => {
    const codigoLimpio = codigoIngresado.trim().toUpperCase();
    const mensajeInvalido = 'Código inválido. Verifica con tu responsable que esté bien escrito.';

    if (!codigoLimpio || codigoLimpio.includes('/')) {
      throw new Error(mensajeInvalido);
    }

    const credenciales = await signInAnonymously(auth);
    try {
      const snapCodigo = await getDoc(doc(db, 'codigos', codigoLimpio));
      if (!snapCodigo.exists()) {
        throw new Error(mensajeInvalido);
      }
      const idComunidad = snapCodigo.data().comunidadId;

      // Guardamos el código en el registro: así las reglas comprueban que lo conoce
      await setDoc(doc(db, 'comunidades', idComunidad, 'miembros', credenciales.user.uid), {
        nombreMostrado: nombreMostrado || 'Hermano/a',
        fechaUnion: new Date().toISOString(),
        codigo: codigoLimpio,
      });

      const snapComunidad = await getDoc(doc(db, 'comunidades', idComunidad));
      await AsyncStorage.setItem(CLAVE_STORAGE, idComunidad);
      setComunidadId(idComunidad);
      setComunidad(snapComunidad.data());
      setModo('miembro');
    } catch (error) {
      try {
        await credenciales.user.delete();
      } catch (e) {
        // sin importancia
      }
      if (error?.code === 'permission-denied') throw new Error(mensajeInvalido);
      throw error;
    }
  };

  const salir = async () => {
    try {
      // Un miembro que sale libera su lugar en la lista del responsable
      if (modo === 'miembro' && comunidadId && auth.currentUser) {
        await deleteDoc(doc(db, 'comunidades', comunidadId, 'miembros', auth.currentUser.uid));
      }
    } catch (error) {
      console.log('No se pudo quitar el registro de miembro:', error?.code);
    }
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
        recuperarContrasena,
        regenerarCodigo,
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
