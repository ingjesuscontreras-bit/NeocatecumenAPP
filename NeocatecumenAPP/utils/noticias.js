/**
 * utils/noticias.js
 * Fuentes de noticias y lectura de sus titulares (RSS).
 * Solo se muestran título, fecha y enlace: al tocar, se abre la página original.
 * Para agregar una fuente, añade un bloque a FUENTES. Si no tiene feed, deja feed: null.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const FUENTES = [
  {
    id: 'camino',
    categoria: 'camino',
    nombre: 'Camino Neocatecumenal',
    sitio: 'https://neocatechumenaleiter.org/noticias/',
    feed: 'https://neocatechumenaleiter.org/feed/',
  },
  {
    id: 'vatican',
    categoria: 'iglesia',
    nombre: 'Vatican News',
    sitio: 'https://www.vaticannews.va/es.html',
    feed: 'https://www.vaticannews.va/es.rss.xml',
  },
  {
    id: 'aci',
    categoria: 'iglesia',
    nombre: 'ACI Prensa',
    sitio: 'https://www.aciprensa.com/',
    feed: null,
  },
];

const VIGENCIA_MS = 30 * 60 * 1000; // reutiliza lo guardado por 30 minutos
const MAX_TITULARES = 6;
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function limpiarTexto(texto) {
  return texto
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&#039;|&#39;|&apos;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function leerEtiqueta(bloque, nombre) {
  const coincidencia = bloque.match(new RegExp(`<${nombre}[^>]*>([\\s\\S]*?)<\\/${nombre}>`, 'i'));
  return coincidencia ? limpiarTexto(coincidencia[1]) : '';
}

function parsearRss(xml) {
  const items = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
  return items
    .map((bloque) => ({
      titulo: leerEtiqueta(bloque, 'title'),
      enlace: leerEtiqueta(bloque, 'link'),
      fecha: leerEtiqueta(bloque, 'pubDate'),
    }))
    .filter((n) => n.titulo && /^https?:\/\//i.test(n.enlace))
    .slice(0, MAX_TITULARES);
}

async function pedirTexto(url) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), 10000);
  try {
    const respuesta = await fetch(url, {
      signal: controlador.signal,
      headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
    });
    if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);
    return await respuesta.text();
  } finally {
    clearTimeout(temporizador);
  }
}

/** Devuelve la lista de titulares de una fuente. Nunca lanza error: si falla, devuelve [] o lo último guardado. */
export async function obtenerTitulares(fuente, forzar = false) {
  if (!fuente.feed) return [];

  const clave = `noticias:${fuente.id}`;
  let guardado = null;
  try {
    const texto = await AsyncStorage.getItem(clave);
    guardado = texto ? JSON.parse(texto) : null;
  } catch (error) {
    // sin caché
  }

  if (!forzar && guardado && Date.now() - guardado.guardadoEn < VIGENCIA_MS) {
    return guardado.titulares;
  }

  try {
    const xml = await pedirTexto(fuente.feed);
    const titulares = parsearRss(xml);
    console.log(`Noticias ${fuente.nombre}: ${titulares.length} titulares`);
    if (titulares.length > 0) {
      try {
        await AsyncStorage.setItem(clave, JSON.stringify({ guardadoEn: Date.now(), titulares }));
      } catch (error) {
        // sin importancia
      }
      return titulares;
    }
    console.log(`Noticias ${fuente.nombre}: el feed no trajo titulares válidos`);
  } catch (error) {
    console.log(`Noticias ${fuente.nombre}: no se pudo leer (${error?.message})`);
  }
  return guardado ? guardado.titulares : [];
}

export function formatoFecha(texto) {
  if (!texto) return '';
  const fecha = new Date(texto);
  if (isNaN(fecha.getTime())) return '';
  return `${fecha.getDate()} ${MESES_CORTOS[fecha.getMonth()]}`;
}
