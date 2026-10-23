/**
 * utils/evangelio.js
 * Lee del servicio de Evangelizo.org (en español): el Evangelio del día,
 * su cita y el santo del día. Guarda en el teléfono por día.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = 'https://feed.evangelizo.org/v2/reader.php';

export function claveFecha(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}${mes}${dia}`;
}

// Convierte el HTML que devuelve el servicio en texto limpio
function limpiarHtml(texto) {
  return texto
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function pedir(parametros) {
  const consulta = Object.entries(parametros)
    .map(([clave, valor]) => `${clave}=${encodeURIComponent(valor)}`)
    .join('&');

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), 10000);
  try {
    const respuesta = await fetch(`${BASE}?${consulta}`, { signal: controlador.signal });
    if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);
    return limpiarHtml(await respuesta.text());
  } finally {
    clearTimeout(temporizador);
  }
}

async function leerCache(clave) {
  try {
    const guardado = await AsyncStorage.getItem(clave);
    return guardado ? JSON.parse(guardado) : null;
  } catch (error) {
    return null;
  }
}

async function guardarCache(clave, valor) {
  try {
    await AsyncStorage.setItem(clave, JSON.stringify(valor));
  } catch (error) {
    // sin importancia
  }
}

// Una cita bíblica es corta y lleva números (capítulo y versículos)
function pareceCita(texto) {
  return !!texto && texto.length <= 120 && /\d/.test(texto);
}

/** Devuelve { titulo, texto }. "titulo" es la cita (ej. "Lucas 12, 39-48"). */
export async function obtenerEvangelio(fecha = new Date()) {
  const clave = claveFecha(fecha);
  const claveCache = `evangelio2:${clave}`;

  const guardado = await leerCache(claveCache);
  if (guardado) return guardado;

  const texto = await pedir({ date: clave, type: 'reading', lang: 'SP', content: 'GSP' });
  if (!texto) throw new Error('Respuesta vacía');

  // Probamos dos formas de pedir la cita y usamos la primera que parezca una cita
  let titulo = '';
  const candidatos = {};
  for (const tipo of ['title', 'reading_lt']) {
    try {
      const respuesta = await pedir({ date: clave, type: tipo, lang: 'SP', content: 'GSP' });
      const primeraLinea = respuesta.split('\n')[0].trim();
      candidatos[tipo] = primeraLinea;
      if (!titulo && pareceCita(primeraLinea)) titulo = primeraLinea;
    } catch (error) {
      candidatos[tipo] = `error: ${error?.message}`;
    }
  }
  console.log('Evangelio - candidatos de cita:', JSON.stringify(candidatos));

  const resultado = { titulo, texto };
  // Solo se guarda si hay cita; si no, se vuelve a intentar la próxima vez
  if (titulo) await guardarCache(claveCache, resultado);
  return resultado;
}

/** Devuelve el nombre del santo del día (texto). */
export async function obtenerSanto(fecha = new Date()) {
  const clave = claveFecha(fecha);
  const claveCache = `santo:${clave}`;

  const guardado = await leerCache(claveCache);
  if (guardado?.nombre) return guardado.nombre;

  const nombre = await pedir({ date: clave, type: 'saint', lang: 'SP' });
  if (!nombre) throw new Error('Respuesta vacía');

  await guardarCache(claveCache, { nombre });
  return nombre;
}
