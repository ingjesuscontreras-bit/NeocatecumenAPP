/**
 * utils/avisos.js
 * Reglas de los avisos del Responsable: vigencia, orden y enlaces.
 */

// Si falta el "https://", lo agrega. Devuelve null si no parece un enlace válido.
export function normalizarUrl(texto) {
  let url = (texto || '').trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  return /^https?:\/\/[^\s/]+\.[^\s/]+/i.test(url) ? url : null;
}

export function diasDesdeHoy(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

// Vigente = no tiene fecha de ocultar, o todavía no llega
export function estaVigente(aviso, ahora = new Date()) {
  if (!aviso.ocultarEn) return true;
  return new Date(aviso.ocultarEn).getTime() >= ahora.getTime();
}

const masNuevoPrimero = (a, b) => (b.creadoEn || '').localeCompare(a.creadoEn || '');

export function vigentes(lista) {
  return lista.filter((a) => estaVigente(a)).sort(masNuevoPrimero);
}

export function separarAvisos(lista) {
  return {
    vigentes: lista.filter((a) => estaVigente(a)).sort(masNuevoPrimero),
    vencidos: lista.filter((a) => !estaVigente(a)).sort(masNuevoPrimero),
  };
}