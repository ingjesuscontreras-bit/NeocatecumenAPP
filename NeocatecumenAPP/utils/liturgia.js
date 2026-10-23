/**
 * utils/liturgia.js
 * Calcula (sin internet) en qué punto del año litúrgico estamos
 * y arma los enlaces a iBreviary.
 * Nota: no calcula fiestas ni memorias de santos; eso lo muestra iBreviary.
 */
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function aRomano(n) {
  const mapa = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let resultado = '';
  for (const [valor, simbolo] of mapa) {
    while (n >= valor) {
      resultado += simbolo;
      n -= valor;
    }
  }
  return resultado;
}

function inicioDelDia(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function sumarDias(fecha, dias) {
  const f = inicioDelDia(fecha);
  f.setDate(f.getDate() + dias);
  return f;
}

// Días entre dos fechas (usa UTC para que el cambio de hora no afecte)
function diasEntre(desde, hasta) {
  const a = Date.UTC(desde.getFullYear(), desde.getMonth(), desde.getDate());
  const b = Date.UTC(hasta.getFullYear(), hasta.getMonth(), hasta.getDate());
  return Math.round((b - a) / 86400000);
}

function domingoEnOAntes(fecha) {
  return sumarDias(fecha, -fecha.getDay());
}

// Domingo de Pascua (algoritmo de Meeus/Jones/Butcher)
function calcularPascua(anio) {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(anio, mes - 1, dia);
}

// Primer domingo de Adviento: 3 semanas antes del domingo que cae en o antes del 24 dic.
function inicioAdviento(anio) {
  return sumarDias(domingoEnOAntes(new Date(anio, 11, 24)), -21);
}

// Bautismo del Señor: domingo siguiente al 6 de enero
function bautismoDelSenor(anio) {
  const epifania = new Date(anio, 0, 6);
  return sumarDias(epifania, 7 - epifania.getDay());
}

const semanaSalterio = (n) => ((n - 1) % 4) + 1;

export function informacionLiturgica(fecha = new Date()) {
  const hoy = inicioDelDia(fecha);
  const anio = hoy.getFullYear();
  const dia = hoy.getDay();
  const esDomingo = dia === 0;

  const base = {
    fechaTexto: `${DIAS[dia]}, ${hoy.getDate()} de ${MESES[hoy.getMonth()]} de ${anio}`,
    fechaCorta: `${hoy.getDate()} de ${MESES[hoy.getMonth()]}`,
    anioFerial: null,
    salterio: null,
  };

  const pascua = calcularPascua(anio);
  const miercolesCeniza = sumarDias(pascua, -46);
  const primerDomingoCuaresma = sumarDias(pascua, -42);
  const pentecostes = sumarDias(pascua, 49);
  const adviento = inicioAdviento(anio);
  const bautismo = bautismoDelSenor(anio);

  // 1) Adviento
  if (hoy >= adviento && hoy < new Date(anio, 11, 25)) {
    const semana = Math.floor(diasEntre(adviento, hoy) / 7) + 1;
    return {
      ...base,
      tiempo: 'Adviento',
      titulo: esDomingo ? `${aRomano(semana)} Domingo de Adviento` : `${semana}ª semana de Adviento`,
      salterio: semanaSalterio(semana),
    };
  }

  // 2) Navidad (25 dic hasta el Bautismo del Señor)
  if (hoy >= new Date(anio, 11, 25) || hoy <= bautismo) {
    return { ...base, tiempo: 'Navidad', titulo: 'Tiempo de Navidad' };
  }

  // 3) Tiempo Ordinario (antes de Cuaresma)
  if (hoy < miercolesCeniza) {
    const semana = Math.floor(diasEntre(bautismo, hoy) / 7) + 1;
    return {
      ...base,
      tiempo: 'Ordinario',
      titulo: esDomingo
        ? `${aRomano(semana)} Domingo del Tiempo Ordinario`
        : `${aRomano(semana)} semana del Tiempo Ordinario`,
      anioFerial: esDomingo ? null : (anio % 2 === 0 ? 'Año II' : 'Año I'),
      salterio: semanaSalterio(semana),
    };
  }

  // 4) Cuaresma y Semana Santa
  if (hoy < pascua) {
    if (hoy < primerDomingoCuaresma) {
      return {
        ...base,
        tiempo: 'Cuaresma',
        titulo: diasEntre(miercolesCeniza, hoy) === 0 ? 'Miércoles de Ceniza' : 'Semana de Ceniza',
        salterio: 4,
      };
    }
    const semana = Math.floor(diasEntre(primerDomingoCuaresma, hoy) / 7) + 1;
    if (semana >= 6) {
      const faltan = diasEntre(hoy, pascua);
      let titulo = 'Semana Santa';
      if (faltan === 7) titulo = 'Domingo de Ramos';
      if (faltan === 3) titulo = 'Jueves Santo';
      if (faltan === 2) titulo = 'Viernes Santo';
      if (faltan === 1) titulo = 'Sábado Santo';
      return { ...base, tiempo: 'Cuaresma', titulo, salterio: faltan <= 3 ? null : 2 };
    }
    return {
      ...base,
      tiempo: 'Cuaresma',
      titulo: esDomingo ? `${aRomano(semana)} Domingo de Cuaresma` : `${semana}ª semana de Cuaresma`,
      salterio: semanaSalterio(semana),
    };
  }

  // 5) Pascua (hasta Pentecostés)
  if (hoy <= pentecostes) {
    const dPascua = diasEntre(pascua, hoy);
    const semana = Math.floor(dPascua / 7) + 1;
    const esPentecostes = diasEntre(pentecostes, hoy) === 0;
    let titulo;
    if (dPascua === 0) titulo = 'Domingo de Pascua de Resurrección';
    else if (semana === 1) titulo = 'Octava de Pascua';
    else if (esPentecostes) titulo = 'Domingo de Pentecostés';
    else if (esDomingo) titulo = `${aRomano(semana)} Domingo de Pascua`;
    else titulo = `${semana}ª semana de Pascua`;
    return {
      ...base,
      tiempo: 'Pascua',
      titulo,
      salterio: semana === 1 || esPentecostes ? null : semanaSalterio(semana),
    };
  }

  // 6) Tiempo Ordinario (después de Pentecostés): se cuenta hacia atrás desde Cristo Rey = semana 34
  const cristoRey = sumarDias(adviento, -7);
  const domingoDeSemana = domingoEnOAntes(hoy);
  const semana = 34 - diasEntre(domingoDeSemana, cristoRey) / 7;
  let titulo = esDomingo
    ? `${aRomano(semana)} Domingo del Tiempo Ordinario`
    : `${aRomano(semana)} semana del Tiempo Ordinario`;
  if (diasEntre(cristoRey, hoy) === 0) titulo = 'Jesucristo, Rey del Universo';
  return {
    ...base,
    tiempo: 'Ordinario',
    titulo,
    anioFerial: esDomingo ? null : (anio % 2 === 0 ? 'Año II' : 'Año I'),
    salterio: semanaSalterio(semana),
  };
}

// ---------- Enlaces a iBreviary ----------
export const HORAS = [
  { clave: 'ufficio_delle_letture', nombre: 'Oficio de Lecturas', icono: 'book-outline' },
  { clave: 'lodi', nombre: 'Laudes', icono: 'sunny-outline' },
  { clave: 'ora_media', nombre: 'Hora Intermedia', icono: 'time-outline' },
  { clave: 'vespri', nombre: 'Vísperas', icono: 'partly-sunny-outline' },
  { clave: 'compieta', nombre: 'Completas', icono: 'moon-outline' },
];

const BASE = 'http://www.ibreviary.com/m2';
export const urlHora = (clave) => `${BASE}/breviario.php?s=${clave}&b=1&lang=es`;
export const URL_LECTURAS = `${BASE}/letture.php?b=1&lang=es`;

// Búsqueda del santo: con el nombre (si ya lo tenemos) o con la fecha
export function urlSantoDelDia(fechaCorta, nombre) {
  const primeraLinea = nombre ? nombre.split('\n')[0].trim().slice(0, 80) : '';
  const consulta = primeraLinea
    ? `${primeraLinea} santo vida biografía`
    : `santo del día ${fechaCorta} santoral católico`;
  return `https://www.google.com/search?q=${encodeURIComponent(consulta)}`;
}