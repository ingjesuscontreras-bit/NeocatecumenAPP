import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const URL_EXPO = 'https://exp.host/--/api/v2/push/send';
const TOKEN_VALIDO = /^Expo(nent)?PushToken\[.+\]$/;

/**
 * Envía una notificación a todos los hermanos de la comunidad que tengan
 * un token guardado. Nunca lanza errores: publicar no debe fallar por esto.
 */
export async function enviarNotificacionComunidad(comunidadId, titulo, cuerpo) {
  try {
    const miembros = await getDocs(collection(db, 'comunidades', comunidadId, 'miembros'));
    const tokens = [
      ...new Set(
        miembros.docs
          .map((d) => d.data().pushToken)
          .filter((t) => typeof t === 'string' && TOKEN_VALIDO.test(t))
      ),
    ];
    if (tokens.length === 0) return { enviados: 0 };

    let enviados = 0;
    for (let i = 0; i < tokens.length; i += 100) {
      const lote = tokens.slice(i, i + 100).map((to) => ({
        to,
        title: titulo,
        body: cuerpo,
        sound: 'default',
        channelId: 'default',
      }));
      const respuesta = await fetch(URL_EXPO, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(lote),
      });
      const json = await respuesta.json();
      enviados += (json.data || []).filter((r) => r.status === 'ok').length;
    }
    return { enviados };
  } catch (error) {
    console.log('enviarNotificacionComunidad:', error?.message || error);
    return { enviados: 0, error: true };
  }
}
