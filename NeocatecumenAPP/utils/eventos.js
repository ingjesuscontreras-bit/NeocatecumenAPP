/**
 * utils/eventos.js
 * Fechas de las celebraciones: textos, y reglas para saber si ya pasaron.
 */
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// Cuántas horas después del inicio se sigue mostrando un evento
export const HORAS_DE_GRACIA = 2;

export function textoFecha(d) {
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

export function textoHora(d) {
  let h = d.getHours();
  const minutos = String(d.getMinutes()).padStart(2, '0');
  const sufijo = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minutos} ${sufijo}`;
}

// Fecha inicial al crear un evento: hoy a las 7:30 PM (o mañana, si ya pasó)
export function fechaPorDefecto() {
  const d = new Date();
  d.setHours(19, 30, 0, 0);
  if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
  return d;
}

// Los eventos antiguos (solo texto, sin fechaHora) no se ocultan solos
export function haPasado(celebracion, ahora = new Date()) {
  if (!celebracion.fechaHora) return false;
  const fin = new Date(celebracion.fechaHora).getTime() + HORAS_DE_GRACIA * 3600000;
  return fin < ahora.getTime();
}

function tiempoDe(celebracion) {
  return celebracion.fechaHora ? new Date(celebracion.fechaHora).getTime() : null;
}

// Próximos primero (del más cercano al más lejano); los que no tienen fecha exacta, al final
function compararProximas(a, b) {
  const ta = tiempoDe(a);
  const tb = tiempoDe(b);
  if (ta !== null && tb !== null) return ta - tb;
  if (ta !== null) return -1;
  if (tb !== null) return 1;
  return (b.creadoEn || '').localeCompare(a.creadoEn || '');
}

/** Para Inicio: solo las que no han pasado, ordenadas. */
export function ordenarProximas(lista, ahora = new Date()) {
  return lista.filter((c) => !haPasado(c, ahora)).sort(compararProximas);
}

/** Para Admin: separa en próximas y pasadas (las pasadas, la más reciente primero). */
export function separar(lista, ahora = new Date()) {
  const proximas = lista.filter((c) => !haPasado(c, ahora)).sort(compararProximas);
  const pasadas = lista
    .filter((c) => haPasado(c, ahora))
    .sort((a, b) => tiempoDe(b) - tiempoDe(a));
  return { proximas, pasadas };
}
