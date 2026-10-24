// Conexión directa con la API de Gemini (Google AI Studio), plan gratuito.
// No necesita Cloud Functions, plan Blaze ni módulos nativos: es un simple fetch,
// así que funciona en Expo Go y en el APK sin una compilación nueva.
//
// La clave se lee de EXPO_PUBLIC_GEMINI_API_KEY (archivo .env, que NO se sube a GitHub).
// Importante: crea la clave en un proyecto de Google SIN tarjeta ni facturación.
// Así, aunque alguien la extrajera del APK, lo peor que puede pasar es que se agote
// el cupo gratis del día; nunca puede generar cobros.

import { INSTRUCCIONES_ASISTENTE } from './instrucciones.js';

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Se prueba en orden. Si un modelo no existe o agotó su cupo gratis del día,
// se pasa al siguiente (cada modelo tiene su propio cupo).
export const MODELOS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
];

const MAX_TURNOS_HISTORIAL = 10; // mensajes previos que se envían como contexto
const TIEMPO_LIMITE_MS = 35000; // por modelo; si se pasa, se intenta el siguiente (más rápido)
const TIEMPO_TOTAL_MS = 80000; // tope total de espera para el usuario

// Los modelos Gemini 3 "piensan" antes de responder; en nivel bajo responden mucho más rápido.
function configuracionPara(modelo, conPensamiento) {
  if (conPensamiento && modelo.startsWith('gemini-3')) {
    return { thinkingConfig: { thinkingLevel: 'low' } };
  }
  return undefined;
}

let modeloPreferido = null; // recuerda el último modelo que funcionó

export class ErrorAsistente extends Error {
  constructor(mensajeParaUsuario, detalle) {
    super(detalle || mensajeParaUsuario);
    this.mensajeParaUsuario = mensajeParaUsuario;
  }
}

function obtenerClave(claveManual) {
  const clave =
    claveManual ||
    (typeof process !== 'undefined' && process.env
      ? process.env.EXPO_PUBLIC_GEMINI_API_KEY
      : undefined);
  if (!clave) {
    throw new ErrorAsistente(
      'El asistente aún no está configurado. Avisa al Responsable de la comunidad.',
      'Falta EXPO_PUBLIC_GEMINI_API_KEY'
    );
  }
  return clave;
}

// historial: [{ rol: 'usuario' | 'asistente', texto: '...' }, ...]
// El último elemento debe ser la pregunta del usuario.
function construirCuerpo(historial) {
  const recientes = historial.slice(-MAX_TURNOS_HISTORIAL);
  // La API exige que la conversación empiece con un mensaje del usuario.
  while (recientes.length && recientes[0].rol !== 'usuario') recientes.shift();

  return {
    systemInstruction: { parts: [{ text: INSTRUCCIONES_ASISTENTE }] },
    contents: recientes.map((m) => ({
      role: m.rol === 'usuario' ? 'user' : 'model',
      parts: [{ text: m.texto }],
    })),
  };
}

function extraerTexto(datos) {
  if (datos?.promptFeedback?.blockReason) {
    return null;
  }
  const candidato = datos?.candidates?.[0];
  const partes = candidato?.content?.parts || [];
  const texto = partes
    .filter((p) => typeof p.text === 'string' && !p.thought)
    .map((p) => p.text)
    .join('')
    .trim();
  return texto || null;
}

async function llamarModelo(modelo, cuerpo, clave, limiteMs = TIEMPO_LIMITE_MS) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), limiteMs);
  try {
    const respuesta = await fetch(`${API_URL}/${modelo}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': clave,
      },
      body: JSON.stringify(cuerpo),
      signal: controlador.signal,
    });
    const datos = await respuesta.json().catch(() => ({}));
    return { estado: respuesta.status, datos };
  } finally {
    clearTimeout(temporizador);
  }
}

/**
 * Envía la conversación al asistente y devuelve el texto de la respuesta.
 * Lanza ErrorAsistente con un mensaje amable si algo falla.
 */
export async function preguntarAlAsistente(historial, { claveApi } = {}) {
  const clave = obtenerClave(claveApi);
  const cuerpo = construirCuerpo(historial);
  if (!cuerpo.contents.length) {
    throw new ErrorAsistente('Escribe una pregunta para comenzar.');
  }

  const orden = modeloPreferido
    ? [modeloPreferido, ...MODELOS.filter((m) => m !== modeloPreferido)]
    : MODELOS;

  let huboLimite = false;
  let huboDemora = false;
  let ultimoDetalle = '';
  const inicio = Date.now();

  for (const modelo of orden) {
    const restante = TIEMPO_TOTAL_MS - (Date.now() - inicio);
    if (restante < 5000) break;

    let resultado;
    let conPensamiento = true;
    try {
      const config = configuracionPara(modelo, conPensamiento);
      resultado = await llamarModelo(
        modelo,
        config ? { ...cuerpo, generationConfig: config } : cuerpo,
        clave,
        Math.min(TIEMPO_LIMITE_MS, restante)
      );
      // Si el modelo no acepta la opción de pensamiento, repetir sin ella.
      if (
        config &&
        resultado.estado === 400 &&
        /thinking/i.test(resultado.datos?.error?.message || '')
      ) {
        conPensamiento = false;
        resultado = await llamarModelo(modelo, cuerpo, clave, Math.min(TIEMPO_LIMITE_MS, restante));
      }
    } catch (e) {
      if (e?.name === 'AbortError') {
        huboDemora = true; // tardó mucho: probar el siguiente modelo, que es más ligero
        ultimoDetalle = `${modelo}: timeout`;
        continue;
      }
      throw new ErrorAsistente(
        'No hay conexión a internet o el servicio no responde. Inténtalo más tarde.',
        String(e)
      );
    }

    const { estado, datos } = resultado;
    ultimoDetalle = `${modelo}: ${estado} ${datos?.error?.message || ''}`;

    if (estado === 200) {
      const texto = extraerTexto(datos);
      if (!texto) {
        return 'No puedo responder a esa consulta. Solo trabajo con temas de fe, Biblia e Iglesia a partir de fuentes oficiales.';
      }
      modeloPreferido = modelo;
      return texto;
    }

    if (estado === 404) continue; // el modelo no existe o fue retirado: probar el siguiente
    if (estado === 429) {
      huboLimite = true; // cupo gratis agotado para este modelo: probar el siguiente
      continue;
    }
    if (estado === 400 && /not found|not supported|unsupported/i.test(datos?.error?.message || '')) {
      continue;
    }
    if (estado === 400 || estado === 401 || estado === 403) {
      throw new ErrorAsistente(
        'El asistente no está bien configurado. Avisa al Responsable de la comunidad.',
        ultimoDetalle
      );
    }
    if (estado >= 500) continue; // error temporal de Google: probar otro modelo
  }

  if (huboDemora && !huboLimite) {
    throw new ErrorAsistente('La respuesta tardó demasiado. Inténtalo de nuevo.', ultimoDetalle);
  }
  if (huboLimite) {
    throw new ErrorAsistente(
      'El asistente alcanzó el límite gratuito por ahora. Inténtalo en unos minutos o mañana.',
      ultimoDetalle
    );
  }
  throw new ErrorAsistente('El asistente no está disponible en este momento. Inténtalo más tarde.', ultimoDetalle);
}
